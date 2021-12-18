import assert from "assert";
import React from "react";
import { useRecoilValue } from "recoil";
import { localState } from "../../atoms/local";
import { getVideoAudioEnabled } from "../../lib/mesh/stream";
import GridVideo from "./grid-video";
import Video from "./video";

export default function LocalVideo() {
  const local = useRecoilValue(localState);

  assert(local.status === "connecting" || local.status === "connected");

  const { videoEnabled } = getVideoAudioEnabled(local.stream.stream);

  return (
    <GridVideo name={`${local.name} (You)`}>
      <>
        {local.stream.stream !== null && (
          <Video
            local
            stream={local.stream.stream}
            videoDisabled={!videoEnabled}
          />
        )}
      </>
    </GridVideo>
  );
}
