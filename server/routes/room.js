import express from 'express'
// import {
//   checkText ,
//   checkClientFrom,
//   checkAuthorization ,
//   checkContentTypeBody
// } from '../middlewares/auth.js';
// import {
//   handleGetRooms,
//   handlePostRoom,
//   handlePutRoom,
//   handleDeleteRoom
// } from '../controllers/roomController.js';

const router = express.Router()
// ~在這裡應用中間件 就全部一起使用
// router.use(checkAuthorization);

// router.get('/', handleGetRooms); // 需要 Authorization
// router.post('/', handlePostRoom); // 需要 Authorization
// router.put('/:id', handlePutRoom); // 需要 Authorization
// router.delete('/:id', handleDeleteRoom); // 需要 Authorization

export default router
