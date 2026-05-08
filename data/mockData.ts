
import { Student, Subject, AttendanceRecord, BehaviorRecord, ThaiLevel, Department, StudyBlock } from '../types';

export const MOCK_STUDENTS: Student[] = [
  // ปวช. 2 ช่างกลโรงงาน (Page 1)
  { id: '6073', studentId: '6073', name: 'นายปิยพล หวานฉ่ำ', level: ThaiLevel.VC2, department: Department.MECH, room: '1', behaviorScore: 100 },
  { id: '6075', studentId: '6075', name: 'นายจิรวงศ์ ไชยยศ', level: ThaiLevel.VC2, department: Department.MECH, room: '1', behaviorScore: 100 },
  { id: '6076', studentId: '6076', name: 'นายสิริวิชญ์ ถิ่นท่าเรือ', level: ThaiLevel.VC2, department: Department.MECH, room: '1', behaviorScore: 100 },
  { id: '6077', studentId: '6077', name: 'นายกิตติวัฒน์ มุณีจันทร์', level: ThaiLevel.VC2, department: Department.MECH, room: '1', behaviorScore: 100 },
  { id: '6078', studentId: '6078', name: 'นายธนกฤต กั้วงซ้วน', level: ThaiLevel.VC2, department: Department.MECH, room: '1', behaviorScore: 100 },
  { id: '6079', studentId: '6079', name: 'นายวรรณกร ผิวงาม', level: ThaiLevel.VC2, department: Department.MECH, room: '1', behaviorScore: 100 },
  { id: '6080', studentId: '6080', name: 'นายเทพอนันต์ เหมรังษี', level: ThaiLevel.VC2, department: Department.MECH, room: '1', behaviorScore: 100 },
  { id: '6091', studentId: '6091', name: 'นายสิริธร เขียวอุ่น', level: ThaiLevel.VC2, department: Department.MECH, room: '1', behaviorScore: 100 },
  { id: '6094', studentId: '6094', name: 'นายชานนท์ สมเชื้อ', level: ThaiLevel.VC2, department: Department.MECH, room: '1', behaviorScore: 100 },
  { id: '6168', studentId: '6168', name: 'นายอภิรักษ์ เมืองปลอด', level: ThaiLevel.VC2, department: Department.MECH, room: '1', behaviorScore: 100 },

  // ปวช. 2 ช่างไฟฟ้า (Page 2)
  { id: '6082', studentId: '6082', name: 'นายภูวณัฎฐ์ เขียวแดง', level: ThaiLevel.VC2, department: Department.ELEC, room: '1', behaviorScore: 100 },
  { id: '6083', studentId: '6083', name: 'นายนทีชัย สงฤทธิ์', level: ThaiLevel.VC2, department: Department.ELEC, room: '1', behaviorScore: 100 },
  { id: '6085', studentId: '6085', name: 'นายปกรณ์เกียรติ กลิ่นอ่อน', level: ThaiLevel.VC2, department: Department.ELEC, room: '1', behaviorScore: 100 },
  { id: '6162', studentId: '6162', name: 'นางสาวธวัลรัตน์ แก้วอุต', level: ThaiLevel.VC2, department: Department.ELEC, room: '1', behaviorScore: 100 },

  // ปวช. 2 ช่างยนต์ (Page 3)
  { id: '6087', studentId: '6087', name: 'นายธนาวุฒิ รุ่งสวัสดิ์', level: ThaiLevel.VC2, department: Department.AUTO, room: '1', behaviorScore: 100 },
  { id: '6088', studentId: '6088', name: 'นายกิตติกานต์ ฮั่นสกุล', level: ThaiLevel.VC2, department: Department.AUTO, room: '1', behaviorScore: 100 },
  { id: '6089', studentId: '6089', name: 'นายกิตติพร โสดา', level: ThaiLevel.VC2, department: Department.AUTO, room: '1', behaviorScore: 100 },
  { id: '6090', studentId: '6090', name: 'นายวิริทธิ์พล ยอดสร้อย', level: ThaiLevel.VC2, department: Department.AUTO, room: '1', behaviorScore: 100 },
  { id: '6095', studentId: '6095', name: 'นายอาทิตย์ โสกประเทศ', level: ThaiLevel.VC2, department: Department.AUTO, room: '1', behaviorScore: 100 },
  { id: '6096', studentId: '6096', name: 'นายณัฐกรณ์ สุดสิน', level: ThaiLevel.VC2, department: Department.AUTO, room: '1', behaviorScore: 100 },
  { id: '6097', studentId: '6097', name: 'นายวชิรากร สมใจ', level: ThaiLevel.VC2, department: Department.AUTO, room: '1', behaviorScore: 100 },

  // ปวช. 2 เทคโนโลยีธุรกิจดิจิทัล (Page 4)
  { id: '6081', studentId: '6081', name: 'นางสาวกิตติยาภรณ์ พันธุ์ประทุม', level: ThaiLevel.VC2, department: Department.BIZ, room: '1', behaviorScore: 100 },
  { id: '6099', studentId: '6099', name: 'นายวุธิชัย พันธ์เล็ก', level: ThaiLevel.VC2, department: Department.BIZ, room: '1', behaviorScore: 100 },
  { id: '6100', studentId: '6100', name: 'นายอภิรักษ์ ล่วง', level: ThaiLevel.VC2, department: Department.BIZ, room: '1', behaviorScore: 100 },
  { id: '6101', studentId: '6101', name: 'นายธนะเทพ มาสแก้ว', level: ThaiLevel.VC2, department: Department.BIZ, room: '1', behaviorScore: 100 },
  { id: '6102', studentId: '6102', name: 'นายอธิบดี แซ่แต้', level: ThaiLevel.VC2, department: Department.BIZ, room: '1', behaviorScore: 100 },
  { id: '6103', studentId: '6103', name: 'นายคณพศ ม่วงศรี', level: ThaiLevel.VC2, department: Department.BIZ, room: '1', behaviorScore: 100 },
  { id: '6104', studentId: '6104', name: 'นายสุราษฎร์ ชัยณรงค์', level: ThaiLevel.VC2, department: Department.BIZ, room: '1', behaviorScore: 100 },
  { id: '6105', studentId: '6105', name: 'นางสาวณัฐนรี หนักแก้ว', level: ThaiLevel.VC2, department: Department.BIZ, room: '1', behaviorScore: 100 },
  { id: '6164_VC2', studentId: '6164', name: 'นางสาวมานิตา แซ่ด่าน', level: ThaiLevel.VC2, department: Department.BIZ, room: '1', behaviorScore: 100 },

  // ปวช. 3 ช่างกลโรงงาน (Page 5)
  { id: '5935', studentId: '5935', name: 'นายปฎิกร แจ่มกมล', level: ThaiLevel.VC3, department: Department.MECH, room: '1', behaviorScore: 100 },
  { id: '5936', studentId: '5936', name: 'นายภูริภัทร์ หมื่นระย้า', level: ThaiLevel.VC3, department: Department.MECH, room: '1', behaviorScore: 100 },
  { id: '5937', studentId: '5937', name: 'นายสิทธิศักดิ์ สังข์น้อย', level: ThaiLevel.VC3, department: Department.MECH, room: '1', behaviorScore: 100 },
  { id: '5938', studentId: '5938', name: 'นายอติวรรธน์ เขียวอุ่น', level: ThaiLevel.VC3, department: Department.MECH, room: '1', behaviorScore: 100 },
  { id: '5948', studentId: '5948', name: 'นายวุฒิพงษ์ นามะหึงษ์', level: ThaiLevel.VC3, department: Department.MECH, room: '1', behaviorScore: 100 },
  { id: '5950', studentId: '5950', name: 'นายปุญญพัฒน์ หนิดภักดี', level: ThaiLevel.VC3, department: Department.MECH, room: '1', behaviorScore: 100 },
  { id: '6170', studentId: '6170', name: 'นายศิวโรจน์ วิชัยดิษฐ', level: ThaiLevel.VC3, department: Department.MECH, room: '1', behaviorScore: 100 },

  // ปวช. 3 ช่างไฟฟ้า (Page 6)
  { id: '5940', studentId: '5940', name: 'นายกษิดิ์เดช ศึกเสือ', level: ThaiLevel.VC3, department: Department.ELEC, room: '1', behaviorScore: 100 },
  { id: '5943', studentId: '5943', name: 'นายฉันทชา อภิโมทย์', level: ThaiLevel.VC3, department: Department.ELEC, room: '1', behaviorScore: 100 },
  { id: '5945', studentId: '5945', name: 'นายณัฐภัทร ศักดิ์แก้ว', level: ThaiLevel.VC3, department: Department.ELEC, room: '1', behaviorScore: 100 },
  { id: '5946', studentId: '5946', name: 'นายธราเทพ ปานทอง', level: ThaiLevel.VC3, department: Department.ELEC, room: '1', behaviorScore: 100 },
  { id: '5947', studentId: '5947', name: 'นายธิติสรณ์ คะเชนทร์', level: ThaiLevel.VC3, department: Department.ELEC, room: '1', behaviorScore: 100 },
  { id: '5980', studentId: '5980', name: 'นายธันวา ไพรชัฎ', level: ThaiLevel.VC3, department: Department.ELEC, room: '1', behaviorScore: 100 },
  { id: '6173', studentId: '6173', name: 'นายกนิษฐ์ สุขใส', level: ThaiLevel.VC3, department: Department.ELEC, room: '1', behaviorScore: 100 },

  // ปวช. 3 ช่างยนต์ (Page 7)
  { id: '5934', studentId: '5934', name: 'นายธนดล ชลสินธุ์', level: ThaiLevel.VC3, department: Department.AUTO, room: '1', behaviorScore: 100 },
  { id: '5953', studentId: '5953', name: 'นายสุรเกียรติ มีสาย', level: ThaiLevel.VC3, department: Department.AUTO, room: '1', behaviorScore: 100 },

  // ปวช. 3 การบัญชี (Page 8)
  { id: '5954', studentId: '5954', name: 'นางสาวกมลชนก คงมาก', level: ThaiLevel.VC3, department: Department.ACCOUNT, room: '1', behaviorScore: 100 },
  { id: '5955', studentId: '5955', name: 'นางสาวณัฐรดี ปานฉ่ำ', level: ThaiLevel.VC3, department: Department.ACCOUNT, room: '1', behaviorScore: 100 },
  { id: '5961', studentId: '5961', name: 'นางสาวโสภิตา จันทร์ปาน', level: ThaiLevel.VC3, department: Department.ACCOUNT, room: '1', behaviorScore: 100 },

  // ปวช. 3 เทคโนโลยีธุรกิจดิจิทัล (Page 9)
  { id: '5960', studentId: '5960', name: 'นางสาวสุพิชญา จันทร์ผ่อง', level: ThaiLevel.VC3, department: Department.BIZ, room: '1', behaviorScore: 100 },
  { id: '5962', studentId: '5962', name: 'นางสาวดารารัตน์ ช่วยชู', level: ThaiLevel.VC3, department: Department.BIZ, room: '1', behaviorScore: 100 },
  { id: '5964', studentId: '5964', name: 'นายธเนตร สามัคคีคารมย์', level: ThaiLevel.VC3, department: Department.BIZ, room: '1', behaviorScore: 100 },
  { id: '6171', studentId: '6171', name: 'นางสาวสกุลเกศ ช่วยสม', level: ThaiLevel.VC3, department: Department.BIZ, room: '1', behaviorScore: 100 },
  { id: '6172', studentId: '6172', name: 'นางสาวสกุลรัตน์ ช่วยสม', level: ThaiLevel.VC3, department: Department.BIZ, room: '1', behaviorScore: 100 },

  // ปวส. 2 เทคนิคการผลิต (Page 10)
  { id: '6107', studentId: '6107', name: 'นายณภัทร แซ่ลิ้ม', level: ThaiLevel.HVC2, department: Department.PROD, room: '1', behaviorScore: 100 },
  { id: '6109', studentId: '6109', name: 'นายภาคย์สกรณ์ คงมา', level: ThaiLevel.HVC2, department: Department.PROD, room: '1', behaviorScore: 100 },
  { id: '6111', studentId: '6111', name: 'นายเอกเดช ปุรินทราภิบาล', level: ThaiLevel.HVC2, department: Department.PROD, room: '1', behaviorScore: 100 },
  { id: '6112', studentId: '6112', name: 'นายทศวรรษ อุปการดี', level: ThaiLevel.HVC2, department: Department.PROD, room: '1', behaviorScore: 100 },
  { id: '6113', studentId: '6113', name: 'นายกฤตยชญ์ มากคงแก้ว', level: ThaiLevel.HVC2, department: Department.PROD, room: '1', behaviorScore: 100 },
  { id: '6114', studentId: '6114', name: 'นายณภัทร สังข์ชุม', level: ThaiLevel.HVC2, department: Department.PROD, room: '1', behaviorScore: 100 },
  { id: '6115', studentId: '6115', name: 'นายรัชตพล นวลสุทธิ์', level: ThaiLevel.HVC2, department: Department.PROD, room: '1', behaviorScore: 100 },
  { id: '6117', studentId: '6117', name: 'นายศุภณัฐ ธีระพงษ์', level: ThaiLevel.HVC2, department: Department.PROD, room: '1', behaviorScore: 100 },
  { id: '6118', studentId: '6118', name: 'นายธนกฤต สุวรรณรัตน์', level: ThaiLevel.HVC2, department: Department.PROD, room: '1', behaviorScore: 100 },
  { id: '6163', studentId: '6163', name: 'นายจิรพันธ์ สุขผล', level: ThaiLevel.HVC2, department: Department.PROD, room: '1', behaviorScore: 100 },
  { id: '6116', studentId: '6116', name: 'นายเมธัส คงพยัคฆ์', level: ThaiLevel.HVC2, department: Department.PROD, room: '1', behaviorScore: 100 },
  { id: '6174', studentId: '6174', name: 'นายธนชาติ เงินถาวร', level: ThaiLevel.HVC2, department: Department.PROD, room: '1', behaviorScore: 100 },
  { id: '1002', studentId: '1002', name: 'นายพีรพัฒน์ ช่วยรอด', level: ThaiLevel.HVC2, department: Department.PROD, room: '1', behaviorScore: 100 },

  // ปวส. 2 ช่างไฟฟ้า (Page 11)
  { id: '6119', studentId: '6119', name: 'นายชัยวัฒน์ มีด้วง', level: ThaiLevel.HVC2, department: Department.ELEC, room: '1', behaviorScore: 100 },
  { id: '6121', studentId: '6121', name: 'นายเอกวัส แดงสุภา', level: ThaiLevel.HVC2, department: Department.ELEC, room: '1', behaviorScore: 100 },
  { id: '6122', studentId: '6122', name: 'นายอนุศักดิ์ สังข์ทอง', level: ThaiLevel.HVC2, department: Department.ELEC, room: '1', behaviorScore: 100 },
  { id: '6123', studentId: '6123', name: 'นายนัฐพงศ์ จรูญรักษ์', level: ThaiLevel.HVC2, department: Department.ELEC, room: '1', behaviorScore: 100 },
  { id: '6124', studentId: '6124', name: 'นายภคนันท์ บัวทอง', level: ThaiLevel.HVC2, department: Department.ELEC, room: '1', behaviorScore: 100 },
  { id: '6125', studentId: '6125', name: 'นายนนทวัฒน์ ชูมณี', level: ThaiLevel.HVC2, department: Department.ELEC, room: '1', behaviorScore: 100 },
  { id: '6126', studentId: '6126', name: 'นายอัมรินทร์ โพธิกุล', level: ThaiLevel.HVC2, department: Department.ELEC, room: '1', behaviorScore: 100 },
  { id: '6127', studentId: '6127', name: 'นายธีรยุทธ แผ้วชนะ', level: ThaiLevel.HVC2, department: Department.ELEC, room: '1', behaviorScore: 100 },
  { id: '6128', studentId: '6128', name: 'นางสาวสายธาร ลือปัญญา', level: ThaiLevel.HVC2, department: Department.ELEC, room: '1', behaviorScore: 100 },
  { id: '6129', studentId: '6129', name: 'นายณัฐวุฒิ ศรีจันทร์เพ็ชร', level: ThaiLevel.HVC2, department: Department.ELEC, room: '1', behaviorScore: 100 },
  { id: '6130', studentId: '6130', name: 'นายณัฐพนธ์ ชูเพชร', level: ThaiLevel.HVC2, department: Department.ELEC, room: '1', behaviorScore: 100 },
  { id: '6131', studentId: '6131', name: 'นายอภิสิทธิ์ เพ็ชรด่า', level: ThaiLevel.HVC2, department: Department.ELEC, room: '1', behaviorScore: 100 },
  { id: '6132', studentId: '6132', name: 'นายสุรเชษฐ์ นาคะเกษม', level: ThaiLevel.HVC2, department: Department.ELEC, room: '1', behaviorScore: 100 },
  { id: '6133', studentId: '6133', name: 'นายพงศกร คงสุข', level: ThaiLevel.HVC2, department: Department.ELEC, room: '1', behaviorScore: 100 },
  { id: '6164_HVC2', studentId: '6164', name: 'นายปวริศ ดิชวงศ์', level: ThaiLevel.HVC2, department: Department.ELEC, room: '1', behaviorScore: 100 },
  { id: '1004', studentId: '1004', name: 'นางสาวเบญจมาศ กอบสุวรรณ', level: ThaiLevel.HVC2, department: Department.ELEC, room: '1', behaviorScore: 100 },
  { id: '1005', studentId: '1005', name: 'นายวิรัลพัชร เพ็ชรนิจินดา', level: ThaiLevel.HVC2, department: Department.ELEC, room: '1', behaviorScore: 100 },

  // ปวส. 2 เทคนิคเครื่องกล (Page 12)
  { id: '6134', studentId: '6134', name: 'นายอนุชิต รักษายศ', level: ThaiLevel.HVC2, department: Department.MACHINE, room: '1', behaviorScore: 100 },
  { id: '6135', studentId: '6135', name: 'นายธนภัทร กุลวงษ์', level: ThaiLevel.HVC2, department: Department.MACHINE, room: '1', behaviorScore: 100 },
  { id: '6136', studentId: '6136', name: 'นายปิยพัทธ์ ปราถนาธรรม', level: ThaiLevel.HVC2, department: Department.MACHINE, room: '1', behaviorScore: 100 },
  { id: '6137', studentId: '6137', name: 'นายปัญจพล ปราถนาธรรม', level: ThaiLevel.HVC2, department: Department.MACHINE, room: '1', behaviorScore: 100 },
  { id: '6138', studentId: '6138', name: 'นายนิติภูมิ สุทธิช่วย', level: ThaiLevel.HVC2, department: Department.MACHINE, room: '1', behaviorScore: 100 },
  { id: '6139', studentId: '6139', name: 'นายภาณุวัฒน์ ปานสุวรรณ', level: ThaiLevel.HVC2, department: Department.MACHINE, room: '1', behaviorScore: 100 },
  { id: '6140', studentId: '6140', name: 'นายณรงค์ฤทธิ์ สามงามแก้ว', level: ThaiLevel.HVC2, department: Department.MACHINE, room: '1', behaviorScore: 100 },
  { id: '6141', studentId: '6141', name: 'นายกฤษฎา จรูญรักษ์', level: ThaiLevel.HVC2, department: Department.MACHINE, room: '1', behaviorScore: 100 },
  { id: '6142', studentId: '6142', name: 'นายณัชพล พรศรี', level: ThaiLevel.HVC2, department: Department.MACHINE, room: '1', behaviorScore: 100 },
  { id: '6143', studentId: '6143', name: 'นายพันทัต นิลมาตร์', level: ThaiLevel.HVC2, department: Department.MACHINE, room: '1', behaviorScore: 100 },
  { id: '6144', studentId: '6144', name: 'นายอรรคเดช หนูหนอง', level: ThaiLevel.HVC2, department: Department.MACHINE, room: '1', behaviorScore: 100 },
  { id: '6145', studentId: '6145', name: 'นายอัษฎาวุฒิ รักษาวงศ์', level: ThaiLevel.HVC2, department: Department.MACHINE, room: '1', behaviorScore: 100 },
  { id: '6146', studentId: '6146', name: 'นายยศภัทร ตั้นเซ่ง', level: ThaiLevel.HVC2, department: Department.MACHINE, room: '1', behaviorScore: 100 },
  { id: '6147', studentId: '6147', name: 'นายปุญญวัฒน์ ณ นคร', level: ThaiLevel.HVC2, department: Department.MACHINE, room: '1', behaviorScore: 100 },
  { id: '6148', studentId: '6148', name: 'นายจิรศักดิ์ จันทร์พิทักษ์', level: ThaiLevel.HVC2, department: Department.MACHINE, room: '1', behaviorScore: 100 },
  { id: '6149', studentId: '6149', name: 'นายสบชัย ไทรจีน', level: ThaiLevel.HVC2, department: Department.MACHINE, room: '1', behaviorScore: 100 },
  { id: '6175', studentId: '6175', name: 'นายฐิติกร ริยาพันธ์', level: ThaiLevel.HVC2, department: Department.MACHINE, room: '1', behaviorScore: 100 },

  // ปวส. 2 เทคโนโลยีธุรกิจดิจิทัล (Page 13)
  { id: '6106', studentId: '6106', name: 'นางสาววริศรา แซ่ด่าน', level: ThaiLevel.HVC2, department: Department.BIZ, room: '1', behaviorScore: 100 },
  { id: '6108', studentId: '6108', name: 'นายสิทธิชัย งามศุภกร', level: ThaiLevel.HVC2, department: Department.BIZ, room: '1', behaviorScore: 100 },
  { id: '6150', studentId: '6150', name: 'นางสาวรวีวรรณ ปานเพชร', level: ThaiLevel.HVC2, department: Department.BIZ, room: '1', behaviorScore: 100 },
  { id: '6151', studentId: '6151', name: 'นางสาวพรรณพิษา บุญสุข', level: ThaiLevel.HVC2, department: Department.BIZ, room: '1', behaviorScore: 100 },
  { id: '6152', studentId: '6152', name: 'นางสาวนันท์นภัส จันทวงศ์', level: ThaiLevel.HVC2, department: Department.BIZ, room: '1', behaviorScore: 100 },
  { id: '6153', studentId: '6153', name: 'นายธนกฤต จินดาศักดิ์', level: ThaiLevel.HVC2, department: Department.BIZ, room: '1', behaviorScore: 100 },
  { id: '6154', studentId: '6154', name: 'นางสาวปิยธิดา มณีโชติ', level: ThaiLevel.HVC2, department: Department.BIZ, room: '1', behaviorScore: 100 },
  { id: '6155', studentId: '6155', name: 'นายศักดิ์ชัย สมวงค์', level: ThaiLevel.HVC2, department: Department.BIZ, room: '1', behaviorScore: 100 },
  { id: '6156', studentId: '6156', name: 'นายฉัตรตฤณ พงศกร', level: ThaiLevel.HVC2, department: Department.BIZ, room: '1', behaviorScore: 100 },
  { id: '6157', studentId: '6157', name: 'นายนราวิชญ์ ชุมชอบ', level: ThaiLevel.HVC2, department: Department.BIZ, room: '1', behaviorScore: 100 },
  { id: '6158', studentId: '6158', name: 'นายนัฐวุฒิ สุขมณี', level: ThaiLevel.HVC2, department: Department.BIZ, room: '1', behaviorScore: 100 },
  { id: '6159', studentId: '6159', name: 'นางสาวสุวนันท์ เวียงชัย', level: ThaiLevel.HVC2, department: Department.BIZ, room: '1', behaviorScore: 100 },

  // ปวส. 2 การจัดการธุรกิจค้าปลีก (Page 14)
  { id: '6110_RETAIL', studentId: '6110', name: 'นางสาวศิกัญญา วิยุทธ', level: ThaiLevel.HVC2, department: Department.RETAIL, room: '1', behaviorScore: 100 },
  { id: '6160', studentId: '6160', name: 'นางสาวแก้วตะวัน วงศ์เสถียร', level: ThaiLevel.HVC2, department: Department.RETAIL, room: '1', behaviorScore: 100 },
  { id: '6161', studentId: '6161', name: 'นางสาวเกศรา ช่างสุวรรณ', level: ThaiLevel.HVC2, department: Department.RETAIL, room: '1', behaviorScore: 100 },
];

export const MOCK_STUDY_BLOCKS: StudyBlock[] = [
  { id: 1, name: 'บล็อกที่ 1', startDate: '2024-05-15', endDate: '2024-06-15', isActive: true, holidays: [], examDate: '2024-06-15' },
  { id: 2, name: 'บล็อกที่ 2', startDate: '2024-06-16', endDate: '2024-07-16', isActive: false, holidays: [], examDate: '2024-07-16' },
  { id: 3, name: 'บล็อกที่ 3', startDate: '2024-07-17', endDate: '2024-08-17', isActive: false, holidays: [], examDate: '2024-08-17' },
  { id: 4, name: 'บล็อกที่ 4', startDate: '2024-08-18', endDate: '2024-09-18', isActive: false, holidays: [], examDate: '2024-08-18' },
  { id: 5, name: 'บล็อกที่ 5', startDate: '2024-09-19', endDate: '2024-10-19', isActive: false, holidays: [], examDate: '2024-09-19' },
];

export const MOCK_SUBJECTS: Subject[] = [
  { id: 'S1', name: 'การพัฒนาเว็บไซต์ด้วย React', code: 'IT30201', teacherId: 'T1', level: 'ปวช. 1', department: 'เทคโนโลยีสารสนเทศ' },
  { id: 'S2', name: 'ภาษาอังกฤษเพื่ออาชีพ', code: 'EN10101', teacherId: 'T1', level: 'ปวช. 1', department: 'เทคโนโลยีสารสนเทศ' },
  { id: 'S3', name: 'ระบบปฏิบัติการเบื้องต้น', code: 'IT10102', teacherId: 'T2', level: 'ปวช. 2', department: 'เทคโนโลยีสารสนเทศ' },
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: 'A1', studentId: '1', date: '2024-03-20', type: 'MORNING', status: 'PRESENT', timestamp: '2024-03-20 07:45:00' },
  { id: 'A2', studentId: '2', date: '2024-03-20', type: 'MORNING', status: 'LATE', timestamp: '2024-03-20 08:15:00' },
  { id: 'A3', studentId: '3', date: '2024-03-20', type: 'MORNING', status: 'ABSENT', timestamp: '2024-03-20 08:30:00' },
];

export const MOCK_BEHAVIOR: BehaviorRecord[] = [
  { id: 'B1', studentId: '3', type: 'DEDUCT', score: 5, reason: 'มาสายเกิน 3 ครั้ง', date: '2024-03-19', recordedBy: 'ครูสมปอง' },
  { id: 'B2', studentId: '5', type: 'DEDUCT', score: 10, reason: 'หนีเรียน', date: '2024-03-18', recordedBy: 'ครูมานี' },
  { id: 'B3', studentId: '1', type: 'ADD', score: 5, reason: 'ช่วยเหลือกิจกรรมวิทยาลัย', date: '2024-03-20', recordedBy: 'ครูสมปอง' },
];

export const MOCK_TUITION_CONFIGS: TuitionConfig[] = [
  { id: 'C1', level: ThaiLevel.VC2, department: Department.MECH, amount: 15500, description: 'ค่าเทอม ปวช. 2 ช่างกล' },
  { id: 'C2', level: ThaiLevel.VC2, department: Department.ELEC, amount: 16200, description: 'ค่าเทอม ปวช. 2 ช่างไฟฟ้า' },
  { id: 'C3', level: ThaiLevel.VC2, department: Department.AUTO, amount: 15800, description: 'ค่าเทอม ปวช. 2 ช่างยนต์' },
  { id: 'C4', level: ThaiLevel.VC2, department: Department.BIZ, amount: 14500, description: 'ค่าเทอม ปวช. 2 ธุรกิจดิจิทัล' },
  { id: 'C5', level: ThaiLevel.HVC2, department: Department.PROD, amount: 18500, description: 'ค่าเทอม ปวส. 2 เทคนิคการผลิต' },
];
