import { GeneratePodcastProps } from '@/types'
import React, { useEffect, useState } from 'react'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Button } from './ui/button'
import { Loader } from 'lucide-react'
import { useAction, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/components/ui/use-toast"

import { useUploadFiles } from '@xixixao/uploadstuff/react';

const useGeneratePodcast = ({
  setAudio, voiceType, voicePrompt, setAudioStorageId, setVoicePrompt
}: GeneratePodcastProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAudioGenerating, setIsAudioGenerating] = useState(false)
  const { toast } = useToast()

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const { startUpload } = useUploadFiles(generateUploadUrl)

  const getPodcastAudio = useAction(api.openai.generateAudioAction)
  const generateContent = useAction(api.openai.generatePodcastContentAction);


  const getAudioUrl = useMutation(api.podcasts.getUrl);

  const generatePodcast = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsGenerating(true)

    try {
      if (!voiceType && !voicePrompt) {
        toast({
          title: "Please provide a some script to generate a podcast",
        })
        return setIsGenerating(false);
      }

      setAudio('');
      const res = await generateContent({ topic: voicePrompt });
      setVoicePrompt(res)

      toast({
        title: "Podcast generated successfully",
      })

      setVoicePrompt(res)
    } catch (error) {
      toast({
        title: "Error creating a content",
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }

  }

  const generateAudio = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAudioGenerating(true)

    try {
      setAudio('');
      if (!voiceType && !voicePrompt) {
        toast({
          title: "Please provide a voiceType or script to generate a podcast",
        })
        return setIsAudioGenerating(false);
      }

      const response = await getPodcastAudio({
        voice: voiceType,
        input: voicePrompt
      })

      const blob = new Blob([response], { type: 'audio/mpeg' });
      const fileName = `podcast-${uuidv4()}.mp3`;
      const file = new File([blob], fileName, { type: 'audio/mpeg' });

      const uploaded = await startUpload([file]);
      const storageId = (uploaded[0].response as any).storageId;
      setAudioStorageId(storageId)

      setIsAudioGenerating(storageId);

      const audioUrl = await getAudioUrl({ storageId });
      setAudio(audioUrl!);
      toast({
        title: "Podcast generated successfully",
      })

    } catch (error) {
      toast({
        title: "Error creating a content",
        variant: 'destructive',
      })
    } finally {
      setIsAudioGenerating(false)
    }
  }

  return { isGenerating, generatePodcast, generateAudio, isAudioGenerating }
}

const GeneratePodcast = (props: GeneratePodcastProps) => {
  const { isGenerating, generatePodcast, generateAudio, isAudioGenerating } = useGeneratePodcast(props);

  return (
    <div>
      <div className="flex flex-col gap-2.5">
        <Label className="text-16 font-bold text-white-1">
          AI Prompt to generate Podcast
        </Label>
        <Textarea
          className="input-class font-light focus-visible:ring-offset-orange-1"
          placeholder='Provide text to generate audio'
          rows={5}
          value={props.voicePrompt}
          onChange={(e) => props.setVoicePrompt(e.target.value)}
        />
      </div>
      <div className="flex gap-8 mt-5 w-full max-w-[200px]">
        <Button disabled={isGenerating || isAudioGenerating} type="submit" className="text-16 bg-orange-1 py-4 font-bold text-white-1" onClick={generatePodcast}>
          {isGenerating ? (
            <>
              Generating
              <Loader size={20} className="animate-spin ml-2" />
            </>
          ) : (
            'AI Generate'
          )}
        </Button>
        <Button disabled={isGenerating || isAudioGenerating} type="submit" className="text-16 bg-green-600 py-4 font-bold text-white-1" onClick={generateAudio}>
          {isAudioGenerating ? (
            <>
              Generating
              <Loader size={20} className="animate-spin ml-2" />
            </>
          ) : (
            'Generate Audio'
          )}
        </Button>
      </div>
      {props.audio && (
        <audio
          controls
          src={props.audio}
          autoPlay
          className="mt-5"
          onLoadedMetadata={(e) => props.setAudioDuration(e.currentTarget.duration)}
        />
      )}
    </div>
  )
}

export default GeneratePodcast