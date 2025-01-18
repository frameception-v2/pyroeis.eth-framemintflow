import { ImageResponse } from "next/og";
import { PROJECT_TITLE, PROJECT_DESCRIPTION } from "~/lib/constants";

export const alt = "Farcaster Frames V2 Demo";
export const size = {
  width: 600,
  height: 400,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div tw="h-full w-full flex flex-col justify-center items-center relative bg-gradient-to-b from-purple-900 to-indigo-900">
        <div tw="flex flex-col items-center text-center p-8 bg-white/90 rounded-2xl shadow-2xl">
          <h1 tw="text-6xl font-bold text-purple-900 mb-4">{PROJECT_TITLE}</h1>
          <h3 tw="text-2xl text-gray-800 max-w-2xl leading-tight">
            {PROJECT_DESCRIPTION}
          </h3>
          <div tw="mt-6 flex items-center">
            <span tw="text-gray-600 mr-2">Powered by</span>
            <span tw="text-purple-600 font-semibold">Farcaster Frames</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
