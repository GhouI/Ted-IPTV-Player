import { describe, it, expect } from 'vitest'
import {
  parseXMLTVDate,
  parseEpisodeNum,
  parseXMLTV,
  xmltvToEPGData,
  parseXMLTVToEPG,
  getChannelMapping,
} from './xmltvParser'

describe('xmltvParser', () => {
  describe('parseXMLTVDate', () => {
    it('should parse XMLTV date format without timezone', () => {
      const result = parseXMLTVDate('20240115143000')
      expect(result).toBe('2024-01-15T14:30:00+00:00')
    })

    it('should parse XMLTV date format with positive timezone', () => {
      const result = parseXMLTVDate('20240115143000 +0200')
      expect(result).toBe('2024-01-15T14:30:00+02:00')
    })

    it('should parse XMLTV date format with negative timezone', () => {
      const result = parseXMLTVDate('20240115143000 -0500')
      expect(result).toBe('2024-01-15T14:30:00-05:00')
    })

    it('should handle empty string gracefully', () => {
      const result = parseXMLTVDate('')
      expect(result).toBeTruthy()
    })

    it('should handle short invalid string', () => {
      const result = parseXMLTVDate('2024')
      expect(result).toBeTruthy()
    })
  })

  describe('parseEpisodeNum', () => {
    it('should parse xmltv_ns format (0-indexed)', () => {
      const result = parseEpisodeNum('0.5.')
      expect(result).toEqual({ season: 1, episode: 6 })
    })

    it('should parse xmltv_ns format with multiple digits', () => {
      const result = parseEpisodeNum('4.11.')
      expect(result).toEqual({ season: 5, episode: 12 })
    })

    it('should parse simple episode number', () => {
      const result = parseEpisodeNum('5')
      expect(result).toEqual({ episode: 6 })
    })

    it('should parse SxxExx format', () => {
      const result = parseEpisodeNum('S02E05')
      expect(result).toEqual({ season: 2, episode: 5 })
    })

    it('should parse lowercase sxxexx format', () => {
      const result = parseEpisodeNum('s03e10')
      expect(result).toEqual({ season: 3, episode: 10 })
    })

    it('should return empty object for undefined', () => {
      const result = parseEpisodeNum(undefined)
      expect(result).toEqual({})
    })

    it('should return empty object for unrecognized format', () => {
      const result = parseEpisodeNum('Episode Five')
      expect(result).toEqual({})
    })
  })

  describe('parseXMLTV', () => {
    const sampleXMLTV = `<?xml version="1.0" encoding="UTF-8"?>
<tv generator-info-name="Test">
  <channel id="channel1">
    <display-name>Test Channel 1</display-name>
    <icon src="http://example.com/logo1.png" />
  </channel>
  <channel id="channel2">
    <display-name>Test Channel 2</display-name>
  </channel>
  <programme start="20240115140000 +0000" stop="20240115150000 +0000" channel="channel1">
    <title>Test Program 1</title>
    <desc>A test program description</desc>
    <category>Documentary</category>
    <episode-num system="xmltv_ns">1.5.</episode-num>
  </programme>
  <programme start="20240115150000 +0000" stop="20240115160000 +0000" channel="channel1">
    <title>Test Program 2</title>
    <icon src="http://example.com/poster.jpg" />
  </programme>
  <programme start="20240115140000 +0000" stop="20240115143000 +0000" channel="channel2">
    <title>Another Show</title>
    <rating>TV-14</rating>
  </programme>
</tv>`

    it('should parse channels from XMLTV', () => {
      const result = parseXMLTV(sampleXMLTV)
      expect(result.channels).toHaveLength(2)
      expect(result.channels[0]).toEqual({
        id: 'channel1',
        displayName: 'Test Channel 1',
        icon: 'http://example.com/logo1.png',
      })
      expect(result.channels[1]).toEqual({
        id: 'channel2',
        displayName: 'Test Channel 2',
        icon: undefined,
      })
    })

    it('should parse programmes from XMLTV', () => {
      const result = parseXMLTV(sampleXMLTV)
      expect(result.programs).toHaveLength(3)
    })

    it('should parse programme details correctly', () => {
      const result = parseXMLTV(sampleXMLTV)
      const program = result.programs[0]
      expect(program.channel).toBe('channel1')
      expect(program.title).toBe('Test Program 1')
      expect(program.desc).toBe('A test program description')
      expect(program.category).toBe('Documentary')
      expect(program.start).toBe('20240115140000 +0000')
      expect(program.stop).toBe('20240115150000 +0000')
    })

    it('should parse programme with icon', () => {
      const result = parseXMLTV(sampleXMLTV)
      const program = result.programs[1]
      expect(program.icon).toBe('http://example.com/poster.jpg')
    })

    it('should parse programme with rating', () => {
      const result = parseXMLTV(sampleXMLTV)
      const program = result.programs[2]
      expect(program.rating).toBe('TV-14')
    })

    it('should handle empty XML', () => {
      const result = parseXMLTV('')
      expect(result.channels).toHaveLength(0)
      expect(result.programs).toHaveLength(0)
    })

    it('should handle XML with only channels', () => {
      const xml = `<tv><channel id="ch1"><display-name>Channel</display-name></channel></tv>`
      const result = parseXMLTV(xml)
      expect(result.channels).toHaveLength(1)
      expect(result.programs).toHaveLength(0)
    })
  })

  describe('xmltvToEPGData', () => {
    it('should convert XMLTV data to EPG data format', () => {
      const xmltvData = {
        channels: [{ id: 'ch1', displayName: 'Channel 1' }],
        programs: [
          {
            channel: 'ch1',
            start: '20240115140000 +0000',
            stop: '20240115150000 +0000',
            title: 'Test Show',
            desc: 'Description',
            category: 'Drama',
            episodeNum: '1.5.',
          },
        ],
      }

      const result = xmltvToEPGData(xmltvData, 'test-source')

      expect(result.source).toBe('test-source')
      expect(result.lastUpdated).toBeTruthy()
      expect(result.programs['ch1']).toHaveLength(1)
      expect(result.programs['ch1'][0]).toMatchObject({
        channelId: 'ch1',
        title: 'Test Show',
        description: 'Description',
        category: 'Drama',
        seasonNumber: 2,
        episodeNumber: 6,
      })
    })

    it('should sort programs by start time', () => {
      const xmltvData = {
        channels: [],
        programs: [
          {
            channel: 'ch1',
            start: '20240115160000 +0000',
            stop: '20240115170000 +0000',
            title: 'Later Show',
          },
          {
            channel: 'ch1',
            start: '20240115140000 +0000',
            stop: '20240115150000 +0000',
            title: 'Earlier Show',
          },
        ],
      }

      const result = xmltvToEPGData(xmltvData)

      expect(result.programs['ch1'][0].title).toBe('Earlier Show')
      expect(result.programs['ch1'][1].title).toBe('Later Show')
    })

    it('should group programs by channel', () => {
      const xmltvData = {
        channels: [],
        programs: [
          {
            channel: 'ch1',
            start: '20240115140000 +0000',
            stop: '20240115150000 +0000',
            title: 'Channel 1 Show',
          },
          {
            channel: 'ch2',
            start: '20240115140000 +0000',
            stop: '20240115150000 +0000',
            title: 'Channel 2 Show',
          },
        ],
      }

      const result = xmltvToEPGData(xmltvData)

      expect(Object.keys(result.programs)).toHaveLength(2)
      expect(result.programs['ch1']).toHaveLength(1)
      expect(result.programs['ch2']).toHaveLength(1)
    })
  })

  describe('parseXMLTVToEPG', () => {
    it('should parse XMLTV content directly to EPG data', () => {
      const xml = `<tv>
        <channel id="test"><display-name>Test</display-name></channel>
        <programme start="20240115140000 +0000" stop="20240115150000 +0000" channel="test">
          <title>Test Program</title>
        </programme>
      </tv>`

      const result = parseXMLTVToEPG(xml, 'my-source')

      expect(result.source).toBe('my-source')
      expect(result.programs['test']).toHaveLength(1)
      expect(result.programs['test'][0].title).toBe('Test Program')
    })
  })

  describe('getChannelMapping', () => {
    it('should return channel mapping', () => {
      const xmltvData = {
        channels: [
          { id: 'ch1', displayName: 'Channel 1', icon: 'http://example.com/1.png' },
          { id: 'ch2', displayName: 'Channel 2' },
        ],
        programs: [],
      }

      const mapping = getChannelMapping(xmltvData)

      expect(mapping.size).toBe(2)
      expect(mapping.get('ch1')).toEqual({
        name: 'Channel 1',
        icon: 'http://example.com/1.png',
      })
      expect(mapping.get('ch2')).toEqual({
        name: 'Channel 2',
        icon: undefined,
      })
    })
  })

  describe('XML entity decoding', () => {
    it('should decode XML entities in title', () => {
      const xml = `<tv>
        <programme start="20240115140000 +0000" stop="20240115150000 +0000" channel="ch1">
          <title>Tom &amp; Jerry</title>
        </programme>
      </tv>`

      const result = parseXMLTV(xml)
      expect(result.programs[0].title).toBe('Tom & Jerry')
    })

    it('should decode numeric character references', () => {
      const xml = `<tv>
        <programme start="20240115140000 +0000" stop="20240115150000 +0000" channel="ch1">
          <title>Test &#169; 2024</title>
        </programme>
      </tv>`

      const result = parseXMLTV(xml)
      expect(result.programs[0].title).toBe('Test © 2024')
    })

    it('should decode hex character references', () => {
      const xml = `<tv>
        <programme start="20240115140000 +0000" stop="20240115150000 +0000" channel="ch1">
          <title>Test &#x2022; Point</title>
        </programme>
      </tv>`

      const result = parseXMLTV(xml)
      expect(result.programs[0].title).toBe('Test • Point')
    })
  })
})
