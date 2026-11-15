// Small, editable vector drawings for objects without a suitable stock illustration.
const teal = '#659c9b', dark = '#36546a', gold = '#e8b65c', pink = '#d98b99', cream = '#f6e9cf';
const rect = (x,y,w,h,c,r=3) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${c}"/>`;
const circle = (x,y,r,c) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
const path = (d,c,stroke='none',width=3) => `<path d="${d}" fill="${c}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
const line = (d,c=dark,w=3) => path(d,'none',c,w);
const windows = (n=3) => Array.from({length:n},(_,i)=>rect(19+i*19,29,12,15,'#d9edf1')).join('');
const wheels = () => circle(28,77,10,dark)+circle(75,77,10,dark)+circle(28,77,4,cream)+circle(75,77,4,cream);
const vehicle = (body,top='') => top+body+rect(9,68,82,7,dark)+wheels();
const cabinet = (c,inside='') => rect(14,15,72,70,c)+rect(19,21,62,57,cream)+inside+rect(18,85,7,8,dark)+rect(75,85,7,8,dark);
const bottle = (c,label=cream) => rect(31,24,38,65,c,9)+rect(40,10,20,17,dark)+rect(37,45,26,27,label)+circle(50,58,7,c);
const pump = c => bottle(c)+rect(42,4,30,7,dark)+rect(66,8,7,8,dark);
const cloth = (c,shape='M30 15h40l17 24-15 12-7-10v46H35V41l-7 10-15-12Z') => path(shape,c)+line('M43 16q7 15 14 0',cream,4);
const frame = inner => rect(12,15,76,69,gold)+rect(18,21,64,57,cream)+inner;
const lamp = tall => path(tall?'M50 34v53M32 89h36':'M50 53v29M34 85h32','none',dark,5)+path(tall?'M24 42 36 12h28l12 30Z':'M20 57 33 20h34l13 37Z',teal)+line(tall?'M32 34h36':'M29 48h42',cream,3);
const plate = () => `<ellipse cx="50" cy="58" rx="42" ry="26" fill="${teal}"/><ellipse cx="50" cy="56" rx="35" ry="20" fill="${cream}"/><ellipse cx="50" cy="56" rx="26" ry="13" fill="none" stroke="${teal}" stroke-width="2"/>`;
const house = (c,detail='') => path('M7 39 50 7l43 32Z',pink)+rect(16,39,68,50,c)+rect(42,57,18,32,dark)+rect(23,49,13,17,cream)+rect(67,49,10,17,cream)+detail;
const person = (x,gray) => rect(x-13,54,26,33,teal,12)+circle(x,37,16,'#e7bb94')+path(`M${x-16} 36q-2-26 16-24q22 0 16 24l-7-12-25 12Z`,gray?'#a8a8aa':dark)+circle(x-5,38,1.5,dark)+circle(x+5,38,1.5,dark)+line(`M${x-4} 46q4 3 8 0`,dark,2);
const bird = (neck,body) => `<ellipse cx="51" cy="60" rx="25" ry="21" fill="${body}"/>`+path(`M58 49Q${neck?85:72} 16 70 15q-14-2-12 12l-3 25`,body)+path('m76 20 17 7-17 4Z',gold)+circle(70,21,2,dark)+line('M43 78v13m16-13v13',gold,4);
const drawings = {
 mittens: path('M12 48V28q1-18 19-16q16 0 16 20v15q9-17 17-6q8 12-10 26l-8 17H14Z',pink)+rect(12,77,35,14,teal)+path('M66 43V24q0-17 14-16q13 1 13 17v39L79 76 61 64l-8-16q-2-12 8-9Z',gold)+rect(65,66,27,14,teal),
 fork: path('M32 8h6v24h9V8h6v24h9V8h6v31q-1 15-13 18v32q-5 9-10 0V57Q32 53 32 39Z', '#849da7'),
 vest: cloth(pink,'M31 14h12q7 17 14 0h12l-2 26 10 12v36H23V52l10-12Z'),
 pants: path('M25 14h50l6 73H57l-7-48-7 48H19Z',gold)+line('M27 25h46M50 16v15',dark,2),
 skirt: path('M34 18h32l23 63q-39 19-78 0Z',pink)+rect(33,17,34,9,dark)+line('M37 29 27 79M62 29l11 50',cream,3),
 sweater: cloth(teal)+line('M36 76h28M34 68h32M25 40l5 4M71 44l5-4',cream,3),
 'leather-shoes': path('M12 48h24l8 20 39 5q13 3 8 15H10q-8-21 2-40Z', '#795444')+line('M42 72 32 62m14 14L36 66M10 89h81',cream,3),
 'rain-boots': path('M23 11h36v53l23 7q12 2 8 18H20Z',teal)+rect(18,85,74,8,dark)+rect(21,10,40,8,gold)+circle(40,43,7,gold)+circle(40,67,6,pink),
 photo: frame(path('M20 74 36 49l15 13 14-24 15 36Z',teal)+circle(34,35,8,gold)),
 wall: rect(10,14,80,74,'#e6c2a2')+line('M10 35h80M10 57h80M10 79h80M33 14v21m33 0v22M33 57v22',cream,4),
 'floor-lamp': lamp(true),
 floor: path('M10 37h80l8 50H2Z','#d6af7f')+line('M8 51h84M5 68h90M28 38 18 86M54 38v48M77 38l9 48',cream,2),
 'shoe-cabinet': cabinet(gold,rect(21,47,58,4,dark)+path('M25 38h14l11 5H25Zm28 0h14l10 5H53ZM25 69h14l11 5H25Zm28 0h14l10 5H53Z',teal)),
 'robot-vacuum': `<ellipse cx="50" cy="61" rx="41" ry="26" fill="${dark}"/><ellipse cx="50" cy="53" rx="41" ry="25" fill="${teal}"/>`+circle(62,43,9,dark)+circle(62,43,5,cream)+line('M18 61q30 20 64 0',cream,2),
 'remote-control': rect(31,7,38,86,dark,10)+circle(51,22,5,pink)+circle(50,44,12,teal)+circle(50,44,5,cream)+[0,1,2].map(i=>rect(38,63+i*8,9,4,cream)+rect(53,63+i*8,9,4,cream)).join(''),
 table: `<ellipse cx="50" cy="38" rx="43" ry="18" fill="${gold}"/>`+line('M20 46v40M80 46v40M35 53v31M65 53v31',dark,5),
 tissue: rect(12,45,76,43,pink)+path('M12 45 29 33h46l13 12Z',gold)+path('M35 42 29 13l21 8 21-12-9 33Z',cream),
 cushion: rect(14,16,72,70,pink,17)+path('M17 18q34 13 66 0M17 83q34-14 66 0', 'none',cream,3)+circle(50,51,5,cream),
 socket: rect(18,20,64,61,cream,10)+circle(50,51,22,'#ddcfb6')+rect(38,40,5,13,dark)+rect(57,40,5,13,dark)+circle(50,66,3,dark),
 charger: rect(12,39,31,36,cream)+rect(16,25,5,16,dark)+rect(33,25,5,16,dark)+line('M43 58h11q32-20 33 6t-33 15q-12-8 24-10',teal,4)+rect(79,65,15,9,dark),
 decoration: rect(21,77,58,9,gold)+path('M50 10 60 34l27 4-20 18 5 26-22-13-22 13 5-26-20-18 27-4Z',teal),
 'cargo-van': vehicle(rect(12,29,52,40,dark)+path('M64 38h18l12 17v14H64Z',teal)+rect(69,43,11,13,cream)),
 van: vehicle(path('M12 38q3-12 17-12h42q14 0 20 30v13H10Z',cream)+windows(3)),
 'cash-truck': vehicle(rect(12,29,77,40,teal)+windows(2)+path('M68 35h13v22l-6 5-7-5Z',gold)),
 'water-truck': vehicle(rect(11,37,53,30,teal,14)+path('M66 41h16l12 17v11H66Z',cream)+line('M19 49h37',cream,3)+path('M38 40q-15 17 0 18q15-1 0-18', '#acd7dc')),
 'school-bus': vehicle(rect(10,22,81,47,gold)+windows(4)+rect(12,58,76,4,dark)+path('m11 47 7-4 7 4v9l-7 4-7-4Z',pink)),
 'road-roller': rect(32,22,26,42,gold)+rect(37,27,16,24,cream)+path('M9 57h59l22 12v14H9Z',gold)+circle(27,76,16,dark)+rect(61,62,30,28,'#9ba7a5',10)+line('M66 67v18m8-18v18m8-18v18',dark,2),
 'dump-truck': vehicle(path('M8 25 56 15l10 38-47 14Z',teal)+path('M67 37h15l12 22v10H67Z',gold)+line('M17 30 26 58M31 25l9 29M45 21l8 29',cream,2)),
 bulldozer: vehicle(rect(30,28,31,37,gold)+rect(35,32,21,22,cream)+path('M18 56h58v16H18Z',gold))+path('M75 47h17v39H74Z',dark)+line('M61 58 78 67',teal,5),
 excavator: rect(9,75,59,15,dark,7)+rect(24,52,42,23,gold)+rect(29,35,25,23,gold)+rect(33,39,17,15,cream)+line('M58 55 76 16 90 55',gold,10)+path('M84 53 97 55l-3 22-21-8Z',dark),
 'concrete-mixer-truck': vehicle(path('M63 37h18l13 20v12H63Z',gold)+path('M15 30q25-21 44 7l-7 26H23Z',cream)+path('M19 29 53 56l4-13-24-20Z',teal)),
 'garbage-truck': vehicle(rect(11,25,50,43,teal)+path('M63 38h18l13 20v11H63Z',cream)+path('M22 34h27v25H22Z',dark)+line('M32 37 40 50 27 50 32 42',cream,2)),
 'green-onion': line('M29 83 15 18M46 86 41 10M60 84 68 11M72 81 87 24','#669b5b',8)+line('M29 83 24 63M46 86l-2-21M60 84l3-20M72 81l5-19',cream,9),
 'bamboo-shoot': path('M12 86 39 17l5 37L65 7l5 49 13-18 9 48Z','#b68c51')+path('M12 86 43 54l-5 32 29-30-5 30 23-19 7 19Z',gold),
 durian: path('M9 58 15 39l13-1 5-17 15 8 13-18 10 18 15 3-1 17 10 13-13 13-2 16-20-3-12 9-14-12-16 1Z','#a0ac54')+path('M38 40q34-11 39 16t-39 17Z',gold)+line('M45 43q-13 15 0 27M62 42q-12 16 0 28',cream,3),
 'fire-station': house(teal,rect(37,52,30,37,pink)+line('M40 60h24M40 68h24M40 76h24',cream,2)+circle(50,32,10,cream)+path('M50 23q-13 20 0 19q13-1 0-19',pink)),
 'police-station': house('#7f9fb4',path('m43 23 7-3 7 3v10l-7 5-7-5Z',gold)+rect(37,53,29,36,dark)+line('M50 54v34',cream,2)),
 zoo: house(teal,line('M24 41v42M33 41v42M68 41v42M77 41v42',dark,3)+circle(50,28,11,gold)+circle(45,28,2,dark)+circle(55,28,2,dark)),
 cinema: house(dark,rect(26,43,48,31,cream)+path('M45 48 60 58 45 68Z',pink)+circle(33,21,5,cream)+circle(50,14,5,cream)+circle(67,21,5,cream)),
 kindergarten: house(gold,circle(50,29,10,cream)+line('M50 23v7h6',teal,2)+rect(32,57,5,23,pink)+rect(66,57,5,23,teal)),
 'subway-station': path('M10 86 38 39h45L61 86Z',dark)+line('M17 78h47M24 66h45M31 54h44',cream,4)+rect(28,13,61,21,teal)+path('M36 18h44v10H36Z',cream)+line('M86 34v50',dark,4),
 street: path('M34 7h32l28 86H6Z',dark)+line('M50 16v11m0 13v11m0 14v12',cream,5)+line('M29 22 10 86M71 22l19 64',gold,2),
 'shower-curtain': line('M10 12h80',dark,5)+rect(18,18,64,71,pink)+line('M29 22v60m21-60v60m21-60v60',cream,3)+[25,50,75].map(x=>circle(x,17,5,cream)).join(''),
 'body-wash': pump(teal),
 'shower-cap': path('M12 65q-12-35 15-38q14-23 28-12q29-10 33 22q19 18-2 28Z',pink)+rect(12,63,76,13,teal)+circle(36,35,6,cream)+circle(65,31,6,cream)+circle(71,53,6,cream)+circle(24,53,6,cream),
 'shower-head': line('M77 89V29Q78 7 53 14L37 29',dark,8)+path('M14 41q5-31 33-13l9 14Z',teal)+line('M18 52v9m13-9v15m13-15v11',teal,3),
 'bath-toy': `<ellipse cx="48" cy="70" rx="31" ry="19" fill="${gold}"/>`+circle(62,41,20,gold)+path('M78 40h18l-17 11Z',pink)+circle(66,35,3,dark)+path('M28 65q22-15 25 4q-4 12-25-4', '#d99546'),
 'liquid-soap': pump(pink),
 toothpaste: path('M33 9h36l-7 66H40Z',teal)+rect(39,75,24,16,cream)+rect(37,25,28,33,cream)+path('M43 40q7-14 16 0q-7 14-16 0',pink),
 'laundry-detergent': bottle(pink)+path('M68 27q24 1 15 32H69', 'none',pink,9),
 'washing-machine': cabinet(teal,circle(50,55,23,dark)+circle(50,55,17,'#b7d9df')+path('M34 58q14-10 31 0q-1 15-16 15Z',cream)+rect(22,25,24,5,dark)+circle(71,27,5,gold)),
 sink: rect(9,40,82,35,gold)+`<ellipse cx="50" cy="47" rx="31" ry="10" fill="${cream}"/>`+line('M50 39V19q0-13 15-10v10',teal,6)+rect(18,76,65,12,teal),
 hairdryer: path('M13 20h60q20 4 12 24L64 52H15Z',teal)+circle(73,34,14,dark)+circle(73,34,9,cream)+path('M39 50h20l-4 29H35Z',gold)+line('M45 79q-20 16 11 13h15',dark,3),
 comb: rect(10,25,79,17,pink,8)+Array.from({length:10},(_,i)=>rect(14+i*7,39,4,35,gold)).join(''),
 'bath-towel': rect(18,12,65,76,pink,7)+rect(24,15,14,70,'#edb6b5')+line('M20 72h60M20 78h60',cream,3),
 mat: `<ellipse cx="50" cy="58" rx="43" ry="27" fill="${gold}"/><ellipse cx="50" cy="58" rx="34" ry="19" fill="none" stroke="${cream}" stroke-width="3"/>`,
 'toilet-brush': rect(28,63,44,29,teal)+line('M50 65V10',gold,7)+path('M33 61V44q17-13 34 0v17Z',cream)+line('M37 48v12m8-14v14m9-14v14m8-12v12',teal,2),
 wardrobe: cabinet('#b98258',rect(48,20,4,59,dark)+circle(42,52,3,gold)+circle(59,52,3,gold)),
 curtain: line('M6 12h88',gold,5)+rect(12,18,76,69,'#b8d8dd')+path('M9 16h34L31 57 9 87Zm82 0H57l12 41 22 30Z',teal)+line('M13 53h20M67 53h20',gold,4),
 hanger: line('M48 27q-3-17 8-16q16 6-3 20v8L12 68q-6 7 4 7h70q10-2 0-10L53 39',teal,5),
 'air-conditioner': rect(8,26,84,43,cream,8)+rect(16,56,68,8,teal)+line('M20 59h60',dark,2)+circle(78,38,3,teal)+line('M32 75v12m18-12v17m18-17v12',teal,2),
 'coat-rack': line('M50 12v73M30 90h40M27 38q0 17 23 17q24 0 24-17M33 21q0 13 17 13q16 0 16-13',teal,5)+circle(50,12,5,gold),
 'table-lamp': lamp(false),
 desk: rect(8,33,84,12,gold)+rect(12,45,29,22,pink)+circle(27,54,3,cream)+line('M17 45v45M83 45v45',dark,5),
 pillow: rect(11,27,78,49,cream,14)+line('M17 32q33 9 66 0M17 70q33-9 66 0',pink,2),
 pajamas: cloth(teal,'M26 12h24l-4 32H20l-8-8Z')+path('M57 14h25l8 72H73l-5-35-5 35H48Z',teal)+line('M21 22h24M59 26h23M53 71h34',cream,3)+circle(34,29,2,gold),
 quilt: rect(12,13,76,76,gold,6)+line('M37 16v70m26-70v70M15 38h70M15 63h70',cream,3)+circle(25,26,4,pink)+circle(50,50,4,pink)+circle(75,76,4,pink),
 sheet: path('M14 20h70v52l-12 16-16-9-17 11-26-12Z', '#a9c8d5')+line('M20 30h59M20 45h59M20 60h59M20 74h55',cream,3),
 'alarm-clock': circle(50,51,32,teal)+circle(50,51,25,cream)+line('M50 34v18l12 8M28 80l-8 10M72 80l8 10',dark,4)+path('M11 23Q20 1 35 16ZM65 16Q80 1 89 23Z',gold),
 nightstand: cabinet(gold,rect(21,24,58,19,pink)+rect(21,48,58,23,teal)+circle(50,33,3,cream)+circle(50,59,3,cream)),
 slippers: path('M12 21q22-10 27 12l-1 43q-8 17-26 4Z',pink)+path('M58 32q22-10 27 12l-1 43q-8 17-26 4Z',teal)+line('M12 47q13-8 26 0M58 58q13-8 26 0',cream,5),
 rug: path('M17 16q33-12 66 0l8 70q-41 14-82 0Z',teal)+path('M24 25q27-8 52 0l6 51q-33 11-64 0Z',gold)+path('M33 35h34v33H33Z',pink),
 'range-hood': rect(38,9,24,32,teal)+path('M23 39h54l18 38H5Z',teal)+rect(14,58,72,22,dark)+line('M20 65h60M24 73h52',cream,3),
 'rice-cooker': rect(16,29,68,57,pink,14)+`<ellipse cx="50" cy="28" rx="34" ry="13" fill="${cream}"/>`+rect(35,12,30,8,dark)+rect(34,52,32,19,cream)+circle(50,61,5,teal),
 spatula: line('M50 9v48',dark,8)+path('M31 50h38l-4 39H35Z',pink)+line('M42 60v17m16-17v17',cream,3),
 oil: bottle(gold)+path('M72 32q19 1 12 28H72','none',teal,5),
 sugar: rect(20,34,60,54,cream)+rect(17,25,66,12,teal)+rect(31,55,18,17,gold)+rect(52,48,16,17,gold),
 'soy-sauce': bottle('#8a5341')+rect(40,9,20,10,pink)+path('M42 53h17v13H42Z',gold),
 'dish-detergent': pump(gold),
 refrigerator: rect(22,6,57,88,'#a2c5c8',6)+line('M24 37h53',dark,3)+rect(65,17,5,12,cream)+rect(65,48,5,22,cream)+circle(37,22,5,gold),
 'gas-stove': rect(8,30,84,51,dark,9)+circle(31,50,16,teal)+circle(69,50,16,teal)+circle(31,50,11,dark)+circle(69,50,11,dark)+circle(37,73,4,gold)+circle(61,73,4,gold)+line('M31 31v8m0 22v7M12 50h8m23 0h8M69 31v8m0 22v7M51 50h7m22 0h8',cream,2),
 kettle: path('M28 28h35l8 56H19Z',teal)+path('M65 38q35-7 24 35H69','none',dark,7)+rect(31,17,28,11,gold)+rect(31,80,28,7,dark),
 'microwave-oven': rect(6,24,88,58,gold,7)+rect(13,32,58,42,dark)+rect(18,37,48,32,'#91b6c2')+circle(82,43,6,cream)+circle(82,63,6,cream),
 oven: cabinet(dark,rect(22,25,56,7,gold)+rect(23,43,54,29,'#92acb6')+line('M28 49h44',cream,4)),
 apron: path('M34 14h32l3 26 15 44q-34 12-68 0l15-44Z',pink)+line('M34 16q16-20 32 0',dark,4)+rect(35,50,30,24,gold,6)+line('M29 42H12m59 0h17',dark,4),
 dishwasher: cabinet(teal,rect(23,29,54,5,dark)+line('M24 49h52m-52 8h52m-52 8h52',dark,3)+[32,50,68].map(x=>circle(x,56,11,cream)).join('')),
 'cutting-board': rect(13,27,74,58,gold,9)+rect(39,12,22,19,gold,7)+circle(50,20,4,cream)+line('M22 40h50M22 50h57M22 60h51M22 70h55','#c39758',2),
 blender: path('M29 9h41l-5 49H36Z','#b6d4d4')+rect(26,7,47,8,dark)+path('M70 18q24-3 14 26H69','none',teal,5)+path('M34 62h32l9 30H25Z',pink)+circle(50,77,7,gold)+path('M35 41q15-6 31 0l-3 16H37Z',gold),
 grandparents: person(29,true)+person(72,true),
 pet: path('M13 30h74v59H13Z',gold)+path('M5 32 50 5l45 27Z',pink)+path('M34 89V63q16-27 32 0v26Z',dark)+circle(50,46,7,cream)+circle(41,37,4,cream)+circle(59,37,4,cream),
 ostrich: bird(true,dark)+line('M41 80v12m20-12v12',pink,4),
 barn: house('#b96055',rect(30,46,42,43,cream)+rect(34,50,34,37,pink)+line('M34 50 68 87M68 50 34 87',cream,3)+rect(36,25,29,14,cream)),
 fence: [15,38,61,84].map(x=>path(`M${x-5} 27l5-11 5 11v61H${x-5}Z`,cream)).join('')+rect(7,39,85,9,teal)+rect(7,65,85,9,teal),
 hen: bird(false,cream)+path('M63 11q-4-14 5-9q8-8 9 4q14-1 5 12Z',pink)+path('M26 48 8 25l-2 35 24 10Z',cream),
 mower: path('M9 61h61l13 18H9Z',teal)+rect(32,49,29,16,dark)+circle(20,82,10,dark)+circle(70,82,10,dark)+line('M65 58 83 12H62',dark,5),
 acorn: path('M23 43h54q4 34-27 48Q20 77 23 43Z','#b88955')+path('M15 43q5-32 35-31q28 0 35 31Z',dark)+line('M49 15 57 4',dark,5),
 can: rect(22,20,56,65,teal,8)+`<ellipse cx="50" cy="20" rx="28" ry="8" fill="${cream}"/>`+rect(23,40,54,27,pink)+circle(50,53,10,gold)+line('M45 16h13',dark,2),
 fan: path('M50 84 5 37q45-52 90 0Z',pink)+line('M50 84 15 35M50 84 35 22M50 84 65 22M50 84 85 35',gold,3)+line('M50 84v10',dark,5),
 mop: line('M67 8 40 65',teal,7)+path('M29 59h26l10 28q-31 13-48 0Z',gold)+line('M31 67 25 87M41 67v22M50 67l7 20',cream,3),
 net: `<ellipse cx="62" cy="34" rx="25" ry="27" fill="none" stroke="${teal}" stroke-width="5"/>`+line('M46 54 15 92',dark,7)+line('M44 22h36M40 33h44M43 44h37M52 11v45M63 10v48M73 14v40',gold,1.5),
 queen: person(50,false)+path('M22 88 37 58h26l15 30Z',pink)+path('M32 17 28 3l15 8 8-10 8 10 14-8-5 14Z',gold),
 'x-ray': rect(17,8,66,84,dark)+line('M50 22v56M35 34q15-13 30 0M32 45q18-13 36 0M31 56q19-13 38 0M35 67q15-10 30 0',cream,4),
 zipper: rect(31,9,38,83,teal)+Array.from({length:7},(_,i)=>rect(42,11+i*11,8,5,gold)+rect(50,16+i*11,8,5,gold)).join('')+rect(39,34,24,30,gold,6)+rect(45,43,12,14,cream),
 plate: plate(),
 'steamed-bun': plate()+path('M23 56q-4-36 27-37q31 0 27 37q-26 14-54 0Z', '#fff5dd')+line('M45 23q-13 12-9 25M55 23q13 12 9 25', '#dfc69d',2),
 clam: path('M50 80Q0 62 20 28q16-17 30 1q17-18 31 1q20 34-31 50Z',gold)+line('M50 77 26 33M50 77 39 27M50 77 61 27M50 77 75 35',cream,3),
 vegetable: path('M50 85Q-5 67 15 27q23-12 35 24q15-37 36-23q21 40-36 57Z',teal)+path('M50 85Q21 44 41 15q21-9 28 13q-2 35-19 57Z','#9bb766')+line('M50 82V25M50 64 23 39M51 63l26-23',cream,2),
};
export function sceneIllustration(id) {
  const svg = drawings[id];
  if (!svg) return null;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${svg}</svg>`;
}
