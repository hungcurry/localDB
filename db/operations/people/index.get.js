import { PeopleModel } from '../../models/people.model.js';

// 查詢人員數據
const aggregatePeople = async () => {
  return await PeopleModel.aggregate([
    {
      $project: { __v: 0 }
    }
  ]);
};

// 查詢文檔
const getDBPeople = async () => {
  try {
    const people = await aggregatePeople();
    if (process.env.NODE_ENV === 'dev') {
      console.log('MongoDB');
    }
    if (people.length > 0) {
      console.log('DB 註冊帳號People:', people);
    } else {
      throw new Error('DB No people found'); 
    }
    return people;
  } catch (err) {
    console.error('Error finding people:', err);
    throw err;
  }
};

export { getDBPeople };
