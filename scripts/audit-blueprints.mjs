import esbuild from 'esbuild';
import path from 'node:path';
import fs from 'node:fs';

// Bundle exactPlans.ts + gangdongApartments.ts to temp JS files to inspect all plans mathematically
const outFile = path.resolve('scripts/.tmp-plans.cjs');
const outAptFile = path.resolve('scripts/.tmp-apts.cjs');
esbuild.buildSync({
  entryPoints: [path.resolve('src/data/exactPlans.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: outFile,
});
esbuild.buildSync({
  entryPoints: [path.resolve('src/data/gangdongApartments.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: outAptFile,
});

const exact = await import('file://' + outFile.replace(/\\/g, '/'));
const apts = await import('file://' + outAptFile.replace(/\\/g, '/'));

function pointInPoly(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    const intersect = (yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function findRoomAt(px, py, rooms) {
  return rooms.find((r) => pointInPoly(px, py, r.polygon)) || null;
}

const sampleComplex = apts.GANGDONG_COMPLEXES?.find((c) => c.id === 'godeok-xi');
const sampleRaemian = apts.GANGDONG_COMPLEXES?.find((c) => c.id === 'raemian-hilstate');

const plans = [
  exact.createOlympicForeon84A(true),
  exact.createOlympicForeon23A(true),
  exact.createGodeokGracium84A(true),
  exact.createGodeokGracium84B(true),
  exact.createGodeokArteon84A(true),
  sampleComplex?.plans.find((p) => p.id === 'godeok-xi-84b'),
  sampleRaemian?.plans.find((p) => p.id === 'raemian-hilstate-59a'),
  sampleRaemian?.plans.find((p) => p.id === 'raemian-hilstate-84a'),
  sampleRaemian?.plans.find((p) => p.id === 'raemian-hilstate-84b'),
].filter(Boolean);

function checkRoomOverlaps(rooms) {
  const issues = [];
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const a = rooms[i];
      const b = rooms[j];
      const xsA = a.polygon.map((p) => p.x);
      const ysA = a.polygon.map((p) => p.y);
      const xsB = b.polygon.map((p) => p.x);
      const ysB = b.polygon.map((p) => p.y);
      const minX = Math.max(Math.min(...xsA), Math.min(...xsB));
      const maxX = Math.min(Math.max(...xsA), Math.max(...xsB));
      const minY = Math.max(Math.min(...ysA), Math.min(...ysB));
      const maxY = Math.min(Math.max(...ysA), Math.max(...ysB));
      if (maxX - minX <= 0.1 || maxY - minY <= 0.1) continue;
      let overlapCount = 0;
      for (let x = minX + 0.08; x < maxX - 0.05; x += 0.15) {
        for (let y = minY + 0.08; y < maxY - 0.05; y += 0.15) {
          if (pointInPoly(x, y, a.polygon) && pointInPoly(x, y, b.polygon)) {
            overlapCount++;
          }
        }
      }
      if (overlapCount > 0) {
        issues.push(`Rooms "${a.name}" (${a.id}) and "${b.name}" (${b.id}) overlap! (~${(overlapCount * 0.0225).toFixed(2)} m²)`);
      }
    }
  }
  return issues;
}

let totalIssues = 0;

for (const plan of plans) {
  console.log(`\n=== AUDIT: ${plan.id} (${plan.complexName} ${plan.typeName}) ===`);

  // 1. Audit every door/entrance swing target
  for (const w of plan.walls) {
    const dx = w.x2 - w.x1;
    const dy = w.y2 - w.y1;
    const angle = Math.atan2(dy, dx);
    for (const op of w.openings) {
      if (op.type !== 'door' && op.type !== 'entrance') continue;
      const cx = w.x1 + dx * op.offset;
      const cy = w.y1 + dy * op.offset;
      const swing = op.swing || 'out_left';
      const isInward = swing === 'in_left' || swing === 'in_right';
      const dirY = isInward ? 1 : -1;

      // Local (0, dirY * 0.5) rotated by angle -> world vector into swing space
      const worldSwingX = cx - Math.sin(angle) * dirY * 0.5;
      const worldSwingY = cy + Math.cos(angle) * dirY * 0.5;
      const oppX = cx + Math.sin(angle) * dirY * 0.5;
      const oppY = cy - Math.cos(angle) * dirY * 0.5;

      const targetRoom = findRoomAt(worldSwingX, worldSwingY, plan.rooms);
      const otherRoom = findRoomAt(oppX, oppY, plan.rooms);

      if (op.type === 'entrance' && targetRoom !== null) {
        console.log(`  [DOOR ISSUE] ${w.id}/${op.id} (entrance) swings INTO "${targetRoom.name}" instead of outward! (swing=${swing})`);
        totalIssues++;
      } else if (op.type === 'door') {
        if (!targetRoom) {
          console.log(`  [DOOR ISSUE] ${w.id}/${op.id} swings OUTSIDE apartment! (swing=${swing}, other=${otherRoom?.name})`);
          totalIssues++;
        } else {
          console.log(`  [DOOR OK] ${w.id}/${op.id} -> swings into "${targetRoom.name}" (from "${otherRoom?.name || 'corridor'}") [${swing}]`);
        }
      }
    }
  }

  // 2. Audit furniture & bathroom fixtures inside room bounds
  for (const f of plan.furniture) {
    const room = findRoomAt(f.x, f.y, plan.rooms);
    if (!room) {
      console.log(`  [FIXTURE ISSUE] "${f.name}" (${f.id}) at (${f.x}, ${f.y}) is OUTSIDE any room!`);
      totalIssues++;
    }
  }

  // 3. Audit room-to-room polygon overlaps
  const overlaps = checkRoomOverlaps(plan.rooms);
  for (const msg of overlaps) {
    console.log(`  [OVERLAP ISSUE] ${msg}`);
    totalIssues++;
  }

  // 4. Audit bathroom completeness (must have toilet & vanity)
  for (const r of plan.rooms) {
    if (r.type !== 'bath') continue;
    const fixtures = plan.furniture.filter((f) => pointInPoly(f.x, f.y, r.polygon));
    const hasToilet = fixtures.some((f) => f.category === 'toilet' || /변기/.test(f.name));
    const hasVanity = fixtures.some((f) => f.category === 'vanity' || /세면대/.test(f.name));
    const hasBathOrShower = fixtures.some(
      (f) => f.category === 'bathtub' || f.category === 'shower' || /욕조|샤워/.test(f.name)
    );
    if (!hasToilet || !hasVanity || !hasBathOrShower) {
      console.log(
        `  [BATH ISSUE] "${r.name}" (${r.id}) missing fixtures: toilet=${hasToilet}, vanity=${hasVanity}, bath/shower=${hasBathOrShower}`
      );
      totalIssues++;
    }
  }
}

fs.unlinkSync(outFile);
fs.unlinkSync(outAptFile);
console.log(`\nTOTAL ISSUES FOUND: ${totalIssues}`);
process.exit(totalIssues > 0 ? 1 : 0);
