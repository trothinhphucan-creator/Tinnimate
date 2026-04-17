import { AbsoluteFill, Sequence } from "remotion";
import { Scene1 } from "./scenes/Scene1";
import { Scene2 } from "./scenes/Scene2";
import { Scene3 } from "./scenes/Scene3";
import { Scene4 } from "./scenes/Scene4";

export const MyComposition = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {/* 0 - 5 seconds (0 - 150 frames) */}
      <Sequence from={0} durationInFrames={150}>
        <Scene1 />
      </Sequence>

      {/* 5 - 15 seconds (150 - 450 frames) */}
      <Sequence from={150} durationInFrames={300}>
        <Scene2 />
      </Sequence>

      {/* 15 - 25 seconds (450 - 750 frames) */}
      <Sequence from={450} durationInFrames={300}>
        <Scene3 />
      </Sequence>

      {/* 25 - 30+ seconds (750 - 900+ frames) */}
      <Sequence from={750} durationInFrames={150}>
        <Scene4 />
      </Sequence>
    </AbsoluteFill>
  );
};
