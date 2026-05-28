import React, { useEffect, useRef } from 'react';
import Artplayer from 'artplayer';
import Hls from 'hls.js';

/**
 * CinematicPlayer - A premium video player using Artplayer
 * Optimized for Strimo with advanced subtitle controls
 */
const CinematicPlayer = ({
    url,
    subtitles = [],
    title = '',
    poster = '',
    onReady = () => { },
    className = ''
}) => {
    const artRef = useRef(null);
    const playerInstance = useRef(null);

    useEffect(() => {
        if (!artRef.current) return;

        // Destroy any existing instance before re-initializing
        if (playerInstance.current && playerInstance.current.destroy) {
            playerInstance.current.destroy(false);
            playerInstance.current = null;
        }

        // Initialize Artplayer
        const art = new Artplayer({
            container: artRef.current,
            url: url,
            title: title,
            poster: poster,
            volume: 0.7,
            isLive: false,
            muted: false,
            autoplay: true,
            pip: true,
            autoSize: true,
            autoMini: true,
            screenshot: true,
            setting: true,
            loop: false,
            flip: true,
            playbackRate: true,
            aspectRatio: true,
            fullscreen: true,
            fullscreenWeb: true,
            subtitleOffset: true,
            miniProgressBar: true,
            mutex: true,
            backdrop: true,
            playsInline: true,
            autoPlayback: true,
            airplay: true,
            theme: '#850203', // Strimo Red
            lang: 'en',
            moreVideoAttr: {
                crossOrigin: 'anonymous',
            },
            settings: [
                {
                    html: 'Subtitle Sync',
                    name: 'subtitle-offset',
                    width: 250,
                    tooltip: '0s',
                    selector: [
                        { html: '-5s', value: -5 },
                        { html: '-3s', value: -3 },
                        { html: '-1s', value: -1 },
                        { html: '-0.5s', value: -0.5 },
                        { html: 'Reset (0s)', value: 0, default: true },
                        { html: '+0.5s', value: 0.5 },
                        { html: '+1s', value: 1 },
                        { html: '+3s', value: 3 },
                        { html: '+5s', value: 5 },
                    ],
                    onSelect: function (item) {
                        art.subtitle.offset = item.value;
                        art.notice.show = `Subtitle Sync: ${item.value > 0 ? '+' : ''}${item.value}s`;
                        return item.html;
                    },
                },
            ],
            subtitle: {
                url: subtitles.length > 0 ? subtitles[0].url : '',
                type: 'vtt',
                style: {
                    color: '#fff',
                    fontSize: '28px',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: '600',
                    textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.5)',
                    padding: '0 4px',
                    marginBottom: '20px',
                },
                encoding: 'utf-8',
            },
            customType: {
                m3u8: function (video, url) {
                    if (Hls.isSupported()) {
                        const hls = new Hls();
                        hls.loadSource(url);
                        hls.attachMedia(video);
                        art.on('destroy', () => hls.destroy());
                    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                        video.src = url;
                    } else {
                        art.notice.show = 'Unsupported format';
                    }
                },
            },
            plugins: [
                // Multi-track support
                (art) => {
                    if (subtitles.length > 0) {
                        art.setting.add({
                            name: 'subtitle-tracks',
                            html: 'Subtitle Track',
                            width: 200,
                            selector: subtitles.map((s, index) => ({
                                html: s.label || s.lang || `Track ${index + 1}`,
                                url: s.url,
                                default: index === 0,
                            })),
                            onSelect: function (item) {
                                art.subtitle.url = item.url;
                                art.notice.show = `Language: ${item.html}`;
                                return item.html;
                            },
                        });
                    }
                },
                // Keyboard shortcuts for sync
                (art) => {
                    art.on('keydown', (event) => {
                        if (event.key === 'g') { // G - Decrease delay
                            art.subtitle.offset -= 0.1;
                            art.notice.show = `Subtitle Sync: ${art.subtitle.offset.toFixed(1)}s`;
                        }
                        if (event.key === 'h') { // H - Increase delay
                            art.subtitle.offset += 0.1;
                            art.notice.show = `Subtitle Sync: ${art.subtitle.offset.toFixed(1)}s`;
                        }
                    });
                }
            ]
        });

        playerInstance.current = art;

        art.on('ready', () => {
            onReady(art);
        });

        return () => {
            if (playerInstance.current && playerInstance.current.destroy) {
                playerInstance.current.destroy(false);
            }
        };
    }, [url, subtitles, title, poster]);

    return (
        <div
            ref={artRef}
            className={`artplayer-app cinematic-shadow ${className}`}
            style={{ width: '100%', height: '100%' }}
        />
    );
};

export default CinematicPlayer;