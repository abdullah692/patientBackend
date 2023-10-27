
// const initSocket = (io, app) => {
//     io.on("connection", (socket) => {
//         console.log(`User Connected: ${socket.id}`);
//         socket.on("join_room", (data) => {
//             console.log("HAhaHAhaHAhaHAhaHAhaHA ", data);
//             socket.join(data.room);
//         });
//         // app.set('io', socket);
      
//         // socket.on("book_apmnt", (data) => {
//         //   console.log("*********************************");
//         //   console.log(data);
//         //   console.log("*********************************");
//         //   io.emit("Apmnt_book", { message: "New Appointment Booked!" });
//         // });
//         // socket.on("send_message", (data) => {
//         //   socket.to(data.room).emit("receive_message", data);
//         // });
//       })
// }

// module.exports = initSocket;
