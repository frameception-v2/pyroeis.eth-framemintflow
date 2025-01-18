"use client";

import { useEffect, useCallback, useState } from "react";
import sdk, {
  AddFrame,
  SignIn as SignInCore,
  type Context,
} from "@farcaster/frame-sdk";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { toast } from "~/components/ui/use-toast";

import { config } from "~/components/providers/WagmiProvider";
import { PurpleButton } from "~/components/ui/PurpleButton";
import { truncateAddress } from "~/lib/truncateAddress";
import { base, optimism } from "wagmi/chains";
import { useSession } from "next-auth/react";
import { createStore } from "mipd";
import { Label } from "~/components/ui/label";
import { PROJECT_TITLE } from "~/lib/constants";

function MintCard({ context }: { context: Context.FrameContext }) {
  const [isMinting, setIsMinting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (context?.interaction) {
      setIsLiked(context.interaction.liked);
      setIsFollowing(context.interaction.following);
    }
  }, [context]);

  const handleMint = useCallback(async () => {
    if (!context?.user) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!isLiked || !isFollowing) {
      toast({
        title: "Requirements not met",
        description: "Please like and follow to mint",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsMinting(true);
      
      // Call Zora mint API
      const response = await fetch(ZORA_MINT_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectionAddress: ZORA_COLLECTION_ADDRESS,
          recipient: context.user.address,
          metadata: {
            name: "FrameMintFlow Artwork",
            description: "Minted via FrameMintFlow by pyroeis.eth 🦄",
            image: context.frame.imageUrl,
          }
        })
      });

      if (!response.ok) throw new Error('Mint failed');

      toast({
        title: "Success!",
        description: "Your NFT has been minted on Zora",
      });
    } catch (error) {
      toast({
        title: "Mint Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsMinting(false);
    }
  }, [context, isLiked, isFollowing]);

  return (
    <Card className="border-neutral-200 bg-white">
      <CardHeader>
        <CardTitle className="text-neutral-900">FrameMintFlow</CardTitle>
        <CardDescription className="text-neutral-600">
          Mint your liked images on Zora
        </CardDescription>
      </CardHeader>
      <CardContent className="text-neutral-800">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span>Like: {isLiked ? "✅" : "❌"}</span>
            <span>Follow: {isFollowing ? "✅" : "❌"}</span>
          </div>
          
          <Button 
            onClick={handleMint}
            disabled={!isLiked || !isFollowing || isMinting}
            className="w-full"
          >
            {isMinting ? "Minting..." : "Mint on Zora"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Frame(
  { title }: { title?: string } = { title: PROJECT_TITLE }
) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();

  const [added, setAdded] = useState(false);

  const [addFrameResult, setAddFrameResult] = useState("");

  const addFrame = useCallback(async () => {
    try {
      await sdk.actions.addFrame();
    } catch (error) {
      if (error instanceof AddFrame.RejectedByUser) {
        setAddFrameResult(`Not added: ${error.message}`);
      }

      if (error instanceof AddFrame.InvalidDomainManifest) {
        setAddFrameResult(`Not added: ${error.message}`);
      }

      setAddFrameResult(`Error: ${error}`);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      if (!context) {
        return;
      }

      setContext(context);
      setAdded(context.client.added);

      // If frame isn't already added, prompt user to add it
      if (!context.client.added) {
        addFrame();
      }

      sdk.on("frameAdded", ({ notificationDetails }) => {
        setAdded(true);
      });

      sdk.on("frameAddRejected", ({ reason }) => {
        console.log("frameAddRejected", reason);
      });

      sdk.on("frameRemoved", () => {
        console.log("frameRemoved");
        setAdded(false);
      });

      sdk.on("notificationsEnabled", ({ notificationDetails }) => {
        console.log("notificationsEnabled", notificationDetails);
      });
      sdk.on("notificationsDisabled", () => {
        console.log("notificationsDisabled");
      });

      sdk.on("primaryButtonClicked", () => {
        console.log("primaryButtonClicked");
      });

      console.log("Calling ready");
      sdk.actions.ready({});

      // Set up a MIPD Store, and request Providers.
      const store = createStore();

      // Subscribe to the MIPD Store.
      store.subscribe((providerDetails) => {
        console.log("PROVIDER DETAILS", providerDetails);
        // => [EIP6963ProviderDetail, EIP6963ProviderDetail, ...]
      });
    };
    if (sdk && !isSDKLoaded) {
      console.log("Calling load");
      setIsSDKLoaded(true);
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded, addFrame]);

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      }}
    >
      <div className="w-[300px] mx-auto py-2 px-2">
        <h1 className="text-2xl font-bold text-center mb-4 text-neutral-900">{title}</h1>
        <MintCard context={context} />
      </div>
    </div>
  );
}
