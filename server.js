const express = require('express')
const app = express()
const server = require('http').Server(app);
const io = require('socket.io')(server)
const formidable = require('formidable')
const path = require('path');
let fs = require('fs')
const cookieParser = require('cookie-parser')

//const cors = require('cors');


const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
    debug: true
})

const { v4: uuidv4 } = require('uuid')

let dataFile ;
let error = ''
let usersList = []
//app.use(cors());
app.use(cookieParser())
app.use('/peerjs', peerServer);
app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) =>{
    res.redirect(`${uuidv4()}`)
})

app.get('/:room', (req, res) => {
    res.render('room', {roomId: req.params.room})
})

app.get('/atte',(req,res)=>{
    res.download(__dirname +`/attendance.txt`);   
 })

app.get('/download/:src',(req,res)=>{
    let source=req.params.src
    console.log(source)
   res.download(__dirname + '/' +source);   
})
  function get(file){
      console.log(file)
      if(file===''){
          return dataFile
      }
      else{
        dataFile = file 
        return true
      }
  }
app.post('/api/file', function(req, res) {
    var form = new formidable.IncomingForm();
      // specify that we want to allow the user to upload multiple files in a single request
      form.multiples = true;
      // store all uploads in the /uploads directory
      form.uploadDir = path.basename(path.dirname('/public'))
      // every time a file has been uploaded successfully,
      // rename it to it's orignal name
      form.on('file', function(field, file) {
        fs.rename(file.path, path.join(form.uploadDir, file.name), function(err){
            if (err) throw err;
            //console.log('renamed complete: '+file.name);
            const file_path = '/'+file.name
            file = file_path
            get(file)
            console.log(file)
        });
      });
      // log any errors that occur
      form.on('error', function(err) {
          console.log('An error has occured: \n' + err);
      });
      // once all the files have been uploaded, send a response to the client
      form.on('end', function() {
           res.statusMessage = "Process cashabck initiated";
           res.statusCode = 200;
         res.status(204).send();
        
      });
      // parse the incoming request containing the form data
      form.parse(req);
  })

io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId)
        socket.to(roomId).broadcast.emit('user-connected', userId);

        socket.on('torch',userId=>{
            io.to(roomId).emit('torched-on',userId)
        })

        socket.on('message', (message) => {
            //send message to the same room
            io.to(roomId).emit('createMessage', userId,message)
        })

        socket.on('file-submit',async()=>{
            await new Promise(resolve => setTimeout(resolve, 2000));
            let srcfile = get('')
            console.log(srcfile)
            if(1){
            io.to(roomId).emit('file-shared',srcfile)

            }
          })

          socket.on('screen-shared',(src)=>{
            //  const _srcObject = ss.createStream();
            console.log(src)
            console.log('From screen share', userId)
            io.to(roomId).emit('share-screen',src);
        })

        socket.on('screen-share-cancel', () => {
           //refresh()
          // io.to(roomId).emit('refresh',roomUsers)
           io.to(roomId).emit('screen-share-remove', null)
       })

        socket.on('disconnect', () => {
            socket.to(roomId).broadcast.emit('user-disconnected', userId)
        })
    })
})

server.listen(process.env.PORT || 3000)