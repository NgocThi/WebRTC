
var name; 
var connectedUser;
var conn = new WebSocket('ws://localhost:9090');
 
conn.onopen = function () { 
   console.log("Connected to the signaling server"); 
};
 
conn.onmessage = function (msg) { 
   console.log("Got message", msg.data); 
   var data = JSON.parse(msg.data); 
	
   switch(data.type) { 
      case "login": 
         handleLogin(data.success); 
         break; 
      case "offer": 
         handleOffer(data.offer, data.name); 
         break; 
      case "answer": 
         handleAnswer(data.answer); 
         break; 
      case "candidate": 
         handleCandidate(data.candidate); 
         break; 
      case "leave": 
         handleLeave(); 
         break; 
      default: 
         break; 
   } 
}; 

conn.onerror = function (err) { 
   console.log("Got error", err); 
};
 

function send(message) {  
   if (connectedUser) { 
      message.name = connectedUser; 
   } 
	
   conn.send(JSON.stringify(message)); 
};
 


var loginPage = document.querySelector('#loginPage'); 
var usernameInput = document.querySelector('#usernameInput'); 
var loginBtn = document.querySelector('#loginBtn');

var callPage = document.querySelector('#callPage'); 
var callToUsernameInput = document.querySelector('#callToUsernameInput');
var callBtn = document.querySelector('#callBtn'); 

var hangUpBtn = document.querySelector('#hangUpBtn'); 
var localAudio = document.querySelector('#localAudio'); 
var remoteAudio = document.querySelector('#remoteAudio'); 

var yourConn; 
var stream; 

callPage.style.display = "none";
 

loginBtn.addEventListener("click", function (event) { 
   name = usernameInput.value; 
	
   if (name.length > 0) { 
      send({ 
         type: "login", 
         name: name 
      }); 
   } 
	
});
 
function handleLogin(success) { 
   if (success === false) { 
      alert("Ooops...try a different username"); 
   } else { 
      loginPage.style.display = "none"; 
      callPage.style.display = "block"; 
      navigator.webkitGetUserMedia({ video: false, audio: true }, function (myStream) { 
         stream = myStream; 
			
         
         localAudio.src = window.URL.createObjectURL(stream);
			
       
         var configuration = { 
            "iceServers": [{ "url": "stun:stun2.1.google.com:19302" }] 
         }; 
			
         yourConn = new webkitRTCPeerConnection(configuration); 
			
         yourConn.addStream(stream); 
			
         yourConn.onaddstream = function (e) { 
            remoteAudio.src = window.URL.createObjectURL(e.stream); 
         }; 
			
         yourConn.onicecandidate = function (event) { 
            if (event.candidate) { 
               send({ 
                  type: "candidate", 
                  candidate: event.candidate 
               }); 
            } 
         }; 
			
      }, function (error) { 
         console.log(error); 
      }); 
		
   } 
};
 
//initiating a call 
callBtn.addEventListener("click", function () { 
   var callToUsername = callToUsernameInput.value; 
	
   if (callToUsername.length > 0) { 
      connectedUser = callToUsername; 
		
      // create an offer 
      yourConn.createOffer(function (offer) { 
         send({
            type: "offer", 
            offer: offer 
         }); 
			
         yourConn.setLocalDescription(offer); 
      }, function (error) { 
         alert("Error when creating an offer"); 
      }); 
   } 
});
 
//when somebody sends us an offer 
function handleOffer(offer, name) { 
   connectedUser = name; 
   yourConn.setRemoteDescription(new RTCSessionDescription(offer)); 
	
   //create an answer to an offer 
   yourConn.createAnswer(function (answer) { 
      yourConn.setLocalDescription(answer); 
		
      send({ 
         type: "answer", 
         answer: answer 
      });
		
   }, function (error) { 
      alert("Error when creating an answer"); 
   }); 
	
};
 

function handleAnswer(answer) { 
   yourConn.setRemoteDescription(new RTCSessionDescription(answer)); 
};
 

function handleCandidate(candidate) { 
   yourConn.addIceCandidate(new RTCIceCandidate(candidate)); 
};
 

hangUpBtn.addEventListener("click", function () { 
   send({ 
      type: "leave" 
   }); 
	
   handleLeave(); 
});
 
function handleLeave() { 
   connectedUser = null; 
   remoteAudio.src = null; 
	
   yourConn.close(); 
   yourConn.onicecandidate = null; 
   yourConn.onaddstream = null; 
};