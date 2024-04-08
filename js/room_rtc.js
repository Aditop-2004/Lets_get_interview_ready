// got from Agora.io
const APP_ID = "9429e7225bc34afe80cb7c94208173f8";

//generating a random user id for new participant entering room
let uid = sessionStorage.getItem("uid");
if (!uid) {
  uid = String(Math.floor(Math.random() * 10000));
  sessionStorage.setItem("uid", uid);
}

//tokens are actually used for authentication in agora
let token = null;

//client object will be the core interface for that audio and video functionality
let client;

//room.html?room=234
//extracting the room id from the url
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get("room");

if (!roomId) {
  roomId = "main";
}

let localTracks = [];
let remoteUsers = {};

let joinRoomInit = async () => {
  //a building block for creating an AgoraRTC client as soon the participant joins the room
  client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  await client.join(APP_ID, roomId, token, uid);

  client.on("user-published", handleUserPublished);
  client.on('user-left',handleUserLeft)
  joinStream();
};

//This funtion will ask for the camera and mic access from the user if its the first time on the website
let joinStream = async () => {
  try {
    console.log(1);
    //asks for camera and mic access if already not given by the user
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();
    let player = `<div class="video__container" id="user-container-${uid}">
    <div class="video-player" id="user-${uid}"></div>
    </div>`;
    document
      .getElementById("streams__container")
      .insertAdjacentHTML("beforeend", player);

    //audio track is stored at index 0 of the localTracks array
    //video track is stored at index 1 of the localTracks array
    localTracks[1].play(`user-${uid}`);
  } catch (e) {
    alert("Bhosadike Permission De");
    console.log(e);
  }
  //publish the audio and video tracks when the user joins the streanm
  await client.publish([localTracks[0], localTracks[1]]);
};

//handle the remote users when they enter the room
let handleUserPublished = async (user, mediaType) => {
  remoteUsers[user.uid] = user;

  await client.subscribe(user, mediaType);
  //to ensure that there are no duplicate players in the stream(with the same uid)
  let player = document.getElementById(`user-container-${user.uid}`);
  if (player === null) {
    player = `<div class="video__container" id="user-container-${user.uid}">
  <div class="video-player" id="user-${user.uid}"></div>
  </div>`;
    document
      .getElementById("streams__container")
      .insertAdjacentHTML("beforeend", player);
  }
  if (mediaType === "video") {
    user.videoTrack.play(`user-${user.uid}`);
  }
  if (mediaType === "audio") {
    user.audioTrack.play();
  }
};


//handling when other user left the room

let handleUserLeft = async (user) => {
  delete remoteUsers[user.uid];
  document.getElementById(`user-container-${user.uid}`).remove();
}

joinRoomInit();
