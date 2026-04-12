import { useEffect, useRef, useState, useCallback } from 'react'
import AgoraRTC, { IAgoraRTCClient, ILocalAudioTrack } from 'agora-rtc-sdk-ng'

const APP_ID = import.meta.env.VITE_AGORA_APP_ID as string

interface UseAgoraOptions {
  channel: string
  uid: number
  enabled: boolean
}

export function useAgora({ channel, uid, enabled }: UseAgoraOptions) {
  const clientRef = useRef<IAgoraRTCClient | null>(null)
  const audioTrackRef = useRef<ILocalAudioTrack | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isJoined, setIsJoined] = useState(false)
  const [remoteUsers, setRemoteUsers] = useState<number[]>([])

  const join = useCallback(async () => {
    if (!enabled || isJoined) return
    try {
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
      clientRef.current = client

      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType)
        if (mediaType === 'audio') {
          user.audioTrack?.play()
          setRemoteUsers(prev => [...new Set([...prev, user.uid as number])])
        }
      })

      client.on('user-unpublished', (user) => {
        setRemoteUsers(prev => prev.filter(id => id !== user.uid))
      })

      client.on('user-left', (user) => {
        setRemoteUsers(prev => prev.filter(id => id !== user.uid))
      })

      await client.join(APP_ID, channel, null, uid)
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack()
      audioTrackRef.current = audioTrack
      await client.publish([audioTrack])
      setIsJoined(true)
    } catch {
      setIsJoined(false)
    }
  }, [channel, uid, enabled, isJoined])

  const leave = useCallback(async () => {
    if (!isJoined) return
    try {
      audioTrackRef.current?.stop()
      audioTrackRef.current?.close()
      audioTrackRef.current = null
      await clientRef.current?.leave()
      clientRef.current = null
      setIsJoined(false)
      setRemoteUsers([])
    } catch {
      // ignore
    }
  }, [isJoined])

  const toggleMute = useCallback(async () => {
    if (!audioTrackRef.current) return
    const next = !isMuted
    await audioTrackRef.current.setEnabled(!next)
    setIsMuted(next)
  }, [isMuted])

  useEffect(() => {
    if (enabled) join()
    return () => { leave() }
  }, [enabled])

  return { isMuted, isJoined, remoteUsers, toggleMute, join, leave }
}
