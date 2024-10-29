import { PeopleModel } from '../../models/people.model.js';
// 插入一條新文檔
const postDBPeople = async(peopleData) => {
  try {
    const newPerson = new PeopleModel(peopleData);
    await newPerson.save();
    console.log('DB People saved:', newPerson);
    return newPerson; // 返回新保存的人
  } catch (err) {
    console.error('Error saving people:', err);
    return null; // 在錯誤的情況下返回 null 或者可以拋出錯誤
  }
}
export { postDBPeople }
