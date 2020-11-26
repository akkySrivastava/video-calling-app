const socket = io('/')
let  myVideoStream;
const videoGrid = document.getElementById('video-grid')
const myVideo = document.createElement('video');
myVideo.muted = true;

const peer = new Peer(undefined, {
    path: '/peerjs',
    host: '/',
    port: '443',
    pingInterval: '6000'
});

const peers = {}

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    myVideoStream = stream;
   // myVideo.muted = true;
    addVideoStream(myVideo, stream)

    displayUsersList(usersList)  
    socket.on('refresh',list=>{
        displayUsersList(list)
    })

    socket.on('refresh-muted',(list,name)=>{
      console.log(name)
      if(name===USERS){
           $(".main__mute_button").click();
      }
      displayUsersList(list)
  })

    peer.on('call', call => {
        call.answer(stream)
        const video = document.createElement('video')
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream)
        })
    })

    $('.upload').click(()=>{
      socket.emit("file-submit")
  })
    socket.on('file-shared',src=>{
      console.log(src)
      shareTheFile(src)
  })

    socket.on('user-connected', (userId) => {
        connectToNewUser(userId, stream);
    })
})

    socket.on('user-disconnected', userId => {
        //alert(`user-disconnected ID: ${userId}`)
        if(peers[userId])
        {
            peers[userId].close()
        }

    })

    socket.on('torched-on',userId =>{
      if(userId === userId){
      $('#display').css('background','whitesmoke')
      $('.main__left').prepend(`<h5 style = "background-color: whitesmoke;"class="torch_user">` `${userId}` ` Torched on</h5>`);
      setTimeout(()=>{
      $('.main__videos').css('background','black')
      $('.torch_user').remove()
      },5000)
    }
  })


    peer.on('open', id => {
        socket.emit('join-room', ROOM_ID, id);
    })

    const shareTheFile = (src) =>{
      let html = `<li class="chat__convo"><h5>${src}</h5><form action="https://video-calling-app.herokuapp.com/download${src}" method="GET"><button class="btn btn-warning" type="submit">Download File</button></form></li>`;
      $('ul').append(html) 
  }

  function drag(){
    let val = document.querySelectorAll('.VideoStreams')
    for(let i=0;i<val.length;i++){
        const item = val[i]
        val[i].addEventListener('click',()=>{
            displayGrid.append(item);
        })
        val[i].addEventListener('dragstart',()=>{
            displayList.append(item)
        })
    }
    }

const connectToNewUser = (userId,stream) => {
    console.log(userId)
    const call = peer.call(userId, stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream) 
    })
    call.on('close', () => {
        video.remove();
    })

    peers[userId] = call
}

const displayNewuser = (name=>{
  console.log(name)
  let html = `<li class="chat__convo"><h4 class="text-success">${name} Joined</h4></li>`; 
  $('.userslist').append(html)
})

// USER LEFT
const UserLeft = (name=>{
  console.log(name)
  let html = `<li class="chat__convo"><h4 class="text-danger">${name} left</h4></li>`;
  $('.chat__messages__list').append(html)
})

const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata' ,() => {
        video.play();
    })
    videoGrid.append(video);
}
  
  const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
      myVideoStream.getAudioTracks()[0].enabled = false;
      setUnmuteButton();
    } else {
      setMuteButton();
      myVideoStream.getAudioTracks()[0].enabled = true;
    }
  }
  
  const playStop = () => {
    //console.log('object')
    let enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
      myVideoStream.getVideoTracks()[0].enabled = false;
      setPlayVideo()
    } else {
      setStopVideo()
      myVideoStream.getVideoTracks()[0].enabled = true;
    }
  }
  
  const setMuteButton = () => {
    const html = `
      <i class="fas fa-microphone"></i>
      <span>Mute</span>
    `
    document.querySelector('.main__mute_button').innerHTML = html;
  }
  
  const setUnmuteButton = () => {
    const html = `
      <i class="unmute fas fa-microphone-slash"></i>
      <span>Unmute</span>
    `
    document.querySelector('.main__mute_button').innerHTML = html;
  }
  
  const setStopVideo = () => {
    const html = `
      <i class="fas fa-video"></i>
      <span>Stop Video</span>
    `
    document.querySelector('.main__video_button').innerHTML = html;
  }
  
  const setPlayVideo = () => {
    const html = `
    <i class="stop fas fa-video-slash"></i>
      <span>Play Video</span>
    `
    document.querySelector('.main__video_button').innerHTML = html;
  }

  //Torch
  $('.main__torch').click((userId)=>{
    // console.log(userId)
    socket.emit('torch',userId)
})


//chats
let text = $("input");
  // when press enter send message
  $('#chat_message').keydown(function(e) {
    if (e.which == 13 && text.val().length !== 0) {
      socket.emit('message', text.val());
      text.val('')
    }
});
  socket.on("createMessage", (userId, message) => {
    $("ul").append(`<li class="message"><b>${userId}</b><br/>${message}</li>`);
    scrollToBottom()
})

const scrollToBottom = () => {
  var d = $('.main__chat_window');
  d.scrollTop(d.prop("scrollHeight"));
}

//Recording
const start = document.getElementById("start");
const Stop = document.getElementById("stop");
const video = document.querySelector("video");
let recorder, stream;
console.log(myVideoStream)
async function startRecording() {
// const audio = myVideoStream.getAudioTracks()
  
stream = await navigator.mediaDevices.getDisplayMedia({
    video: { mediaSource: "screen" },
    audio:true
  });
  recorder = new MediaRecorder(stream);

  const chunks = [];
  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.onstop = e => {
    const completeBlob = new Blob(chunks, { type: chunks[0].type });
    video.src = URL.createObjectURL(completeBlob);
  };

  recorder.start();
}

start.addEventListener("click", () => {

$('#start').css('visibility','hidden')
$('#stop').css('visibility','visible')

  startRecording();

});
Stop.addEventListener("click", () => {

$('#start').css('visibility','visible')
$('#stop').css('visibility','hidden')
$('.record__video').css('visibility','visible')
//   recorder.stop();
  stream.getVideoTracks()[0].stop();
  stream.getAudioTracks()[0].stop();
});

//screen sharing
socket.on('shareTheScreen',(userId,src)=>{
  console.log(src)
  console.log(userId)
})

var startScreen = document.getElementById("startScreen")
var startVideo = document.getElementById("startVideo")
var stopScreen = document.getElementById("stopScreen")
var videoScreen = document.createElement("video")

var displayMediaOption = {
videoScreen:{
  cursor:'always'
},
audio:false
}


startScreen.addEventListener("click", function(e){
startscreen();
},false)
//let Firstusername = userId
async function startscreen(){

try{
  socket.on('share-screen', (userId) => {
  console.log(userId)

  });
  if(myVideoStream===stream){
  let stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOption);
  stream.inactive = false
  myVideoStream = stream; 
  console.log(myVideoStream)
  oneTimeShare = false   
  //let username = +'(Screening)'
  socket.emit('join-room', ROOM_ID, id) 
      myVideo.srcObject = stream
      myVideo.removeAttribute("class")
      const html = `<i class=" fas fa-desktop"></i>
                      <span style="font-size:18px">Stop</span>`;
      document.querySelector("#startScreen").innerHTML = html;
  }
  else{
  //let username = userId+'(Screening)'
  socket.emit('screen-share-cancel',null) 
      myVideoStream = stream;
      myVideo.setAttribute("class","VideoStreams")
      socket.emit('join-room', ROOM_ID, id) 
      myVideo.srcObject = stream;
        const html = `<i class=" fas fa-desktop"></i>
                      <span style="font-size:18px">Share Screen</span>`;
      document.querySelector("#startScreen").innerHTML = html;
  }        
}

catch(err){
  console.error("Error" + err)
}
}

function stopscreen(e){
let tracks = videoScreen.srcObject.getTracks()

tracks.forEach(track => track.stop())

videoScreen.srcObject = null;
}

async function startvideo(){
try{
  videoScreen.srcObject = await navigator.mediaDevices.getUserMedia(displayMediaOption);
}

catch(err){
  console.error("Error" + err)
}
}

//swictching b/w chat and user
$('.main__controls__ppl').click(()=>{
  $('.chat').css("display","none");
  $('.userslist').css("display", "block")
})

$('.main__controls__chat').click(()=>{
  $('.userslist').css("display","none")
  $('.chat').css("display", "block");
})

//Display UsersList
const displayUsersList = list =>{
  let html = `<li  class="user__list"><h3>${list.length} Joined</h3></li>
  <h6>'Host can Mute and Kick Others'}</h6>
  <br/> 
  `
  document.querySelector('.usersList').innerHTML = html;
  for( i=0; i<list.length ; i++){
      let html = `<li class="user__list"><h6 class="text-dark">${list[i].name}${list[i].host? '(HOST)' :''}</h6>
      <div class="userslist__icons">
      <i onclick="MuteTheUser('${list[i].name}')" class="unmute fas ${list[i].audio ? 'fa-microphone' :  'fa-microphone-slash'}"></i>
      <i class="unmute fas  ${list[i].video ? 'fa-video' :  'fa-video-slash'}"></i>
      <button class="btn btn-outline-dark ${Data.host ? '': 'd-none'}" onclick="BlockTheUser('${list[i].name}')">${Data.host ? 'Block' : ''}</buton>
      </div>
      </li>`;
      $('.usersList').append(html);
  }
}

//Mute the username
function MuteTheUser(name){
  if(Data.host){
      socket.emit('mute-the-user',name)
  }
}
// BLOCK THE USER
function BlockTheUser(name){
  socket.emit('block-the-user',name)
}
socket.on('make-user-leave',user=>{
  if(user===USERS){
      leaveMeet()
  }
})

function leaveMeet(){
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
    if(enabled){
      $('.leave_meeting').click()
    }
    socket.emit('disconnect')  
    setTimeout(()=>{
         window.history.back();
    },1500)

}

