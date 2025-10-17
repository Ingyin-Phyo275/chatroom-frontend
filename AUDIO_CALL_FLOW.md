# Audio Call Implementation Guide
## Socket.io + WebRTC for 1-on-1 Audio Calls

---

## **Frontend Structure**

### **1. State Management**
```tsx
const [isRinging, setIsRinging] = useState(false);        // Am I receiving a call?
const [isCallActive, setIsCallActive] = useState(false);  // Is call ongoing?
const [isMuted, setIsMuted] = useState(false);            // Is my mic muted?
const [incomingCallData, setIncomingCallData] = useState(null); // Who's calling me?

const localStreamRef = useRef<MediaStream | null>(null);  // My audio stream
const remoteStreamRef = useRef<MediaStream | null>(null); // Other person's audio
const peerConnectionRef = useRef<RTCPeerConnection | null>(null); // WebRTC connection
const remoteAudioRef = useRef<HTMLAudioElement | null>(null); // Audio element to play remote audio
```

**Purpose**: Track call state and store media streams

---

### **2. Socket Event Listeners (Setup on Mount)**

```tsx
useEffect(() => {
  // Someone is calling me
  socket.on("incoming-call", handleIncomingCall);

  // Other person answered my call
  socket.on("call-answered", handleCallAnswered);

  // WebRTC signaling events
  socket.on("webrtc-offer", handleReceiveOffer);
  socket.on("webrtc-answer", handleReceiveAnswer);
  socket.on("webrtc-ice-candidate", handleReceiveIceCandidate);

  // Call ended by other person
  socket.on("call-ended", handleCallEnded);

  return () => {
    socket.off("incoming-call");
    socket.off("call-answered");
    socket.off("webrtc-offer");
    socket.off("webrtc-answer");
    socket.off("webrtc-ice-candidate");
    socket.off("call-ended");
  };
}, []);
```

**Purpose**: Listen for all call-related events from backend

---

### **3. Initiating a Call (User 1 clicks call button)**

```tsx
const initiateCall = async (targetUserId: number) => {
  try {
    // Step 1: Get my microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;

    // Step 2: Tell backend I want to call this user
    socket.emit("call-initiate", {
      callerId: myUserId,
      receiverId: targetUserId,
      callerName: myUsername,
    });

    setIsCallActive(true); // Show calling UI
  } catch (error) {
    console.error("Failed to get microphone access:", error);
    alert("Please allow microphone access to make calls");
  }
};
```

**Purpose**: Start the call flow by requesting mic access and notifying backend

---

### **4. Receiving Incoming Call (User 2's device)**

```tsx
const handleIncomingCall = (data: any) => {
  // data = { callerId, callerName, callId }
  setIncomingCallData(data);
  setIsRinging(true);
  playRingtone(); // Optional: play ringtone sound
};
```

**Purpose**: Show incoming call UI when someone calls me

---

### **5. Answering the Call (User 2 clicks answer)**

```tsx
const answerCall = async () => {
  try {
    // Step 1: Get my microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;

    // Step 2: Tell backend I accepted the call
    socket.emit("call-answer", {
      callId: incomingCallData.callId,
      answererId: myUserId,
    });

    // Step 3: Create WebRTC connection
    await createPeerConnection();

    setIsRinging(false);
    setIsCallActive(true);
  } catch (error) {
    console.error("Failed to answer call:", error);
  }
};
```

**Purpose**: Accept the call and prepare WebRTC connection

---

### **6. WebRTC Peer Connection Setup**

```tsx
const createPeerConnection = () => {
  // Create connection with STUN server (helps with NAT traversal)
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  // Add my audio track to the connection
  localStreamRef.current?.getTracks().forEach(track => {
    pc.addTrack(track, localStreamRef.current!);
  });

  // When I receive the other person's audio
  pc.ontrack = (event) => {
    remoteStreamRef.current = event.streams[0];
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = event.streams[0];
    }
  };

  // When ICE candidate is generated, send it to other person via socket
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("webrtc-ice-candidate", {
        callId: incomingCallData.callId,
        candidate: event.candidate,
        toUserId: otherUserId, // The person I'm talking to
      });
    }
  };

  peerConnectionRef.current = pc;
  return pc;
};
```

**Purpose**: Create the WebRTC peer-to-peer connection that will carry audio

---

### **7. Call Answered Handler (User 1 gets notification)**

```tsx
const handleCallAnswered = async (data: any) => {
  // data = { callId, answererId }

  // Create WebRTC connection
  await createPeerConnection();

  // Create and send WebRTC offer
  const offer = await peerConnectionRef.current!.createOffer();
  await peerConnectionRef.current!.setLocalDescription(offer);

  socket.emit("webrtc-offer", {
    callId: data.callId,
    offer: offer,
    toUserId: data.answererId,
  });
};
```

**Purpose**: When User 2 answers, User 1 creates WebRTC offer to establish connection

---

### **8. WebRTC Offer Handler (User 2 receives offer)**

```tsx
const handleReceiveOffer = async (data: any) => {
  // data = { callId, offer, fromUserId }

  const pc = peerConnectionRef.current!;
  await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

  // Create answer
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  // Send answer back
  socket.emit("webrtc-answer", {
    callId: data.callId,
    answer: answer,
    toUserId: data.fromUserId,
  });
};
```

**Purpose**: User 2 receives WebRTC offer and sends back an answer

---

### **9. WebRTC Answer Handler (User 1 receives answer)**

```tsx
const handleReceiveAnswer = async (data: any) => {
  // data = { callId, answer, fromUserId }

  await peerConnectionRef.current!.setRemoteDescription(
    new RTCSessionDescription(data.answer)
  );

  // Now audio should flow both ways!
};
```

**Purpose**: Complete WebRTC handshake - audio can now flow

---

### **10. ICE Candidate Handler (Both users)**

```tsx
const handleReceiveIceCandidate = async (data: any) => {
  // data = { callId, candidate, fromUserId }

  if (peerConnectionRef.current && data.candidate) {
    await peerConnectionRef.current.addIceCandidate(
      new RTCIceCandidate(data.candidate)
    );
  }
};
```

**Purpose**: Exchange network information for peer-to-peer connection (NAT traversal)

---

### **11. Mute/Unmute Controls**

```tsx
const toggleMute = () => {
  if (localStreamRef.current) {
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    setIsMuted(!audioTrack.enabled);
  }
};
```

**Purpose**: Control microphone on/off

---

### **12. End Call**

```tsx
const endCall = () => {
  // Stop my audio tracks
  localStreamRef.current?.getTracks().forEach(track => track.stop());
  localStreamRef.current = null;

  // Close WebRTC connection
  peerConnectionRef.current?.close();
  peerConnectionRef.current = null;

  // Notify backend
  socket.emit("call-end", {
    callId: incomingCallData?.callId,
    userId: myUserId,
  });

  // Reset state
  setIsCallActive(false);
  setIsRinging(false);
  setIncomingCallData(null);
};

const handleCallEnded = () => {
  // Other person ended the call
  endCall();
  alert("Call ended by other person");
};
```

**Purpose**: Clean up resources and close connection

---

## **Backend Structure (Node.js with Socket.io)**

### **1. Call Initiation Handler**

```javascript
socket.on("call-initiate", ({ callerId, receiverId, callerName }) => {
  const callId = generateUniqueCallId(); // Generate unique ID

  // Store call info (optional, for cleanup)
  activeCalls.set(callId, { callerId, receiverId });

  // Notify the receiver
  io.to(receiverId).emit("incoming-call", {
    callId,
    callerId,
    callerName,
  });
});
```

**Purpose**: Route call initiation to the target user

---

### **2. Call Answer Handler**

```javascript
socket.on("call-answer", ({ callId, answererId }) => {
  const call = activeCalls.get(callId);

  // Notify the caller that call was answered
  io.to(call.callerId).emit("call-answered", {
    callId,
    answererId,
  });
});
```

**Purpose**: Notify caller that their call was answered

---

### **3. WebRTC Signaling Relay**

```javascript
// Forward WebRTC offer
socket.on("webrtc-offer", ({ callId, offer, toUserId }) => {
  io.to(toUserId).emit("webrtc-offer", {
    callId,
    offer,
    fromUserId: socket.userId, // Assume you store userId on socket
  });
});

// Forward WebRTC answer
socket.on("webrtc-answer", ({ callId, answer, toUserId }) => {
  io.to(toUserId).emit("webrtc-answer", {
    callId,
    answer,
    fromUserId: socket.userId,
  });
});

// Forward ICE candidates
socket.on("webrtc-ice-candidate", ({ callId, candidate, toUserId }) => {
  io.to(toUserId).emit("webrtc-ice-candidate", {
    callId,
    candidate,
    fromUserId: socket.userId,
  });
});
```

**Purpose**: Backend just relays WebRTC signaling between peers (doesn't handle media)

---

### **4. Call End Handler**

```javascript
socket.on("call-end", ({ callId, userId }) => {
  const call = activeCalls.get(callId);

  // Notify the other person
  const otherUserId = call.callerId === userId ? call.receiverId : call.callerId;
  io.to(otherUserId).emit("call-ended", { callId });

  // Clean up
  activeCalls.delete(callId);
});
```

**Purpose**: Notify other person and clean up call data

---

## **Complete Flow Summary**

### Step-by-Step Process:

1. **User 1** clicks call button → emit `call-initiate` to backend
2. **Backend** receives `call-initiate` → emit `incoming-call` to User 2
3. **User 2** sees incoming call notification → clicks answer → emit `call-answer`
4. **Backend** receives `call-answer` → emit `call-answered` to User 1
5. **User 1** receives `call-answered` → creates WebRTC offer → emit `webrtc-offer`
6. **Backend** relays `webrtc-offer` → User 2 receives offer
7. **User 2** receives offer → creates WebRTC answer → emit `webrtc-answer`
8. **Backend** relays `webrtc-answer` → User 1 receives answer
9. **Both users exchange ICE candidates** via backend for NAT traversal
10. **WebRTC connection established** → Audio flows peer-to-peer directly between browsers!
11. Either user clicks end call → emit `call-end` → backend notifies other user → cleanup

---

## **Key Concepts**

### Socket.io Role (Signaling)
- Coordinates WHO connects to WHOM
- Relays WebRTC signaling messages (offers, answers, ICE candidates)
- Notifies users about call state changes
- Does NOT handle actual audio/video data

### WebRTC Role (Media Transfer)
- Establishes peer-to-peer connection between browsers
- Transfers actual audio/video data directly between users
- Handles NAT traversal using STUN servers
- Provides APIs for microphone/camera access

### The Analogy
- **Socket.io** = Phone operator connecting the call
- **WebRTC** = The actual phone line carrying your voice

Once WebRTC establishes the connection, audio flows directly between users without going through your server!

---

## **Socket Events Reference**

### Frontend Emits:
- `call-initiate` - Start a call
- `call-answer` - Accept incoming call
- `webrtc-offer` - Send WebRTC offer
- `webrtc-answer` - Send WebRTC answer
- `webrtc-ice-candidate` - Send ICE candidate
- `call-end` - End the call

### Frontend Listens:
- `incoming-call` - Receive call notification
- `call-answered` - Call was answered
- `webrtc-offer` - Receive WebRTC offer
- `webrtc-answer` - Receive WebRTC answer
- `webrtc-ice-candidate` - Receive ICE candidate
- `call-ended` - Other person ended call

---

## **UI Components Needed**

1. **Call Button** - Triggers `initiateCall()`
2. **Incoming Call Modal** - Shows when `isRinging === true`
3. **Answer Button** - Triggers `answerCall()`
4. **Reject Button** - Triggers `endCall()`
5. **Active Call UI** - Shows when `isCallActive === true`
6. **Mute Button** - Triggers `toggleMute()`
7. **End Call Button** - Triggers `endCall()`
8. **Hidden Audio Element** - `<audio ref={remoteAudioRef} autoPlay />` to play remote audio

---

## **Important Notes**

- Always request microphone permission before starting call
- Use HTTPS in production (WebRTC requires secure context)
- Handle edge cases: network disconnection, call rejection, busy users
- Consider adding call timeout if not answered within X seconds
- Clean up resources properly to avoid memory leaks
- Test on different browsers (Chrome, Firefox, Safari have slight differences)
