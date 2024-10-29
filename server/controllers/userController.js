
// #region 原生node方式
// ------------------------------
// import headers  from './header.js';
// import { getUsers, postUser, updateUser, deleteUser } from '../db/index.js';

// const handleGetUsers = async(req, res) => {
//   try {
//     const users = await getUsers();
//     successHandle(res, users);
//   } 
//   catch (err) {
//     errorHandle(res, 500, 'Internal Server Error');
//   }
// }
// const handlePostUser = async(req, res) =>{
//   let body = '';
//   req.on('data', chunk => {
//     body += chunk.toString();
//   });
//   req.on('end', async () => {
//     try {
//       const userData = JSON.parse(body);
//       const newUser = await postUser(userData);
//       res.writeHead(201, headers);
//       res.end(JSON.stringify(newUser));
//     } 
//     catch (err) {
//       errorHandle(res, 500, 'Internal Server Error');
//     }
//   });
// }
// const handlePutUser= async(req, res) =>{
//   const userId = req.url.split('/')[2];
//   let body = '';
//   req.on('data', chunk => {
//     body += chunk.toString();
//   });
//   req.on('end', async () => {
//     try {
//       const updateData = JSON.parse(body);
//       const result = await updateUser({ _id: userId }, updateData);
//       if (result.matchedCount === 0) {
//         errorHandle(res, 404, 'User not found');
//       } else {
//         successHandle(res, result);
//       }
//     } catch (err) {
//       errorHandle(res, 500, 'Internal Server Error');
//     }
//   });
// }
// const handleDeleteUser= async(req, res)=> {
//   const userId = req.url.split('/')[2];
//   try {
//     const result = await deleteUser({ _id: userId });
//     if (result.deletedCount === 0) {
//       errorHandle(res, 404, 'User not found');
//     } else {
//       successHandle(res, 'User deleted');
//     }
//   } catch (err) {
//     errorHandle(res, 500, 'Internal Server Error');
//   }
// }
// const successHandle = (res, data) => {
//   res.writeHead(200, headers);
//   res.write(JSON.stringify({
//     status: 'success',
//     data: data
//   }));
//   res.end();
// }
// const errorHandle = (res, statusCode, message) => {
//   res.writeHead(statusCode, headers);
//   res.write(JSON.stringify({
//     status: 'false',
//     message: message
//   }));
//   res.end();
// }

// export {
//   successHandle,
//   errorHandle,
//   handleGetUsers,
//   handlePostUser,
//   handlePutUser,
//   handleDeleteUser,
// };
// ------------------------------
// #endregion


// #region express方式
import { getDBUsers, postDBUser, updateDBUser, deleteDBUser } from '../../db/index.js';

const handleGetUsers = async (req, res, next) => {
  try {
    const users = await getDBUsers();
    res.status(200).json({
      status: 'success',
      statecode: 200,
      data: users,
    });
  } 
  catch (err) {
    // 傳遞錯誤給錯誤處理中間件
    next(err);
  }
};
const handlePostUser = async (req, res, next) => {
  try {
    const userData = req.body; 
    console.log(`server 新增Data`, userData);

    const newUser = await postDBUser(userData);
    res.status(201).json({
      status: 'success',
      statecode: 201,
      data: newUser,
    });
  } 
  catch (err) {
    next(err);
  }
};
const handlePutUser = async (req, res, next) => {
  const userId = req.params.id; // 獲取 URL 中的 user ID
  try {
    const updateData = req.body;
    console.log(`server 更新Data `, updateData);

    const result = await updateDBUser({ _id: userId }, updateData);
    if (result.matchedCount === 0) {
      res.status(404).json({
        status: 'false',
        statecode: 404,
        message: 'User not found',
      });
    } else {
      res.status(200).json({
        status: 'success',
        statecode: 200,
        message: 'Updated successfully',
      });
    }
  } catch (err) {
    next(err);
  }
};
const handleDeleteUser = async (req, res, next) => {
  const userId = req.params.id; // 獲取 URL 中的 user ID
  try {
    const result = await deleteDBUser({ _id: userId });
    if (result.deletedCount === 0) {
      res.status(404).json({
        status: 'false',
        statecode: 404,
        message: 'User not found',
      });
    } else {
      res.status(200).json({
        status: 'success',
        statecode: 200,
        message: 'User deleted successfully',
      });
    }
  } catch (err) {
    next(err);
  }
};


export {
  handleGetUsers,
  handlePostUser,
  handlePutUser,
  handleDeleteUser,
};
