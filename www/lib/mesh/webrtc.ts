import assert from "assert";
import { Socket } from "socket.io-client";
import { ClientEvents, ServerEvents } from "../../../lib/src/types/websockets";
import { Local, LocalStreamKey } from "../../atoms/local";
import { peersActions, SetPeers } from "../../atoms/peers";
import { registerDataChannel } from "./data";
import { mapGet, streamMap } from "./maps";

const iceServers = {
  iceServers: [{ urls: "stun:meet-jit-si-turnrelay.jitsi.net:443" }],
};

export const createRtcPeerConnection = (
  socket: Socket<ServerEvents, ClientEvents>,
  local: Local,
  sid: string,
  setPeers: SetPeers,
  creator: boolean
): RTCPeerConnection => {
  assert(local.status === "connecting");

  const rtcPeerConnection = new RTCPeerConnection(iceServers);
  const stream = mapGet(streamMap, LocalStreamKey);

  stream?.getTracks().forEach((track) => {
    rtcPeerConnection.addTrack(track, stream);
  });

  rtcPeerConnection.ontrack = (e) => {
    if (e.streams.length > 0) {
      streamMap.set(sid, e.streams[0]);
    }
  };

  rtcPeerConnection.onicecandidate = (e) => {
    if (e.candidate !== null) {
      socket.emit("webRtcIceCandidate", {
        sid,
        label: e.candidate.sdpMLineIndex,
        candidate: e.candidate.candidate,
      });
    }

    if (
      rtcPeerConnection.iceConnectionState === "connected" ||
      rtcPeerConnection.iceConnectionState === "completed"
    ) {
      console.debug(`peer fully connected ${sid}`);
      setPeers(peersActions.setPeerConnected(sid));
    }
  };

  if (creator) {
    const channel = rtcPeerConnection.createDataChannel("data");
    registerDataChannel(sid, channel, local, setPeers);
  } else {
    rtcPeerConnection.ondatachannel = (event) => {
      registerDataChannel(sid, event.channel, local, setPeers);
    };
  }

  return rtcPeerConnection;
};
