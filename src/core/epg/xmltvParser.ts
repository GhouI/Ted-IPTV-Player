/**
 * XMLTV EPG Parser
 * Parses XMLTV format data into normalized Program objects
 */

import type { Program, EPGData } from '../types/channel'

/**
 * Raw channel data from XMLTV
 */
export interface XMLTVChannel {
  id: string
  displayName: string
  icon?: string
}

/**
 * Raw program data from XMLTV
 */
export interface XMLTVProgram {
  channel: string
  start: string
  stop: string
  title: string
  desc?: string
  category?: string
  icon?: string
  episodeNum?: string
  rating?: string
}

/**
 * Parsed XMLTV data
 */
export interface XMLTVData {
  channels: XMLTVChannel[]
  programs: XMLTVProgram[]
}

/**
 * Parse XMLTV date format (YYYYMMDDHHmmss +ZZZZ) to ISO 8601 string
 */
export function parseXMLTVDate(dateStr: string): string {
  if (!dateStr || dateStr.length < 14) {
    return new Date().toISOString()
  }

  const year = dateStr.substring(0, 4)
  const month = dateStr.substring(4, 6)
  const day = dateStr.substring(6, 8)
  const hour = dateStr.substring(8, 10)
  const minute = dateStr.substring(10, 12)
  const second = dateStr.substring(12, 14)

  // Check for timezone offset (e.g., +0000, -0500)
  let tzOffset = '+00:00'
  const tzMatch = dateStr.match(/\s*([+-]\d{4})/)
  if (tzMatch) {
    const tz = tzMatch[1]
    tzOffset = `${tz.substring(0, 3)}:${tz.substring(3, 5)}`
  }

  return `${year}-${month}-${day}T${hour}:${minute}:${second}${tzOffset}`
}

/**
 * Parse episode number from XMLTV format
 * Common formats: "0.5." (season 1, episode 6), "5" (episode 6)
 */
export function parseEpisodeNum(
  episodeStr: string | undefined
): { season?: number; episode?: number } {
  if (!episodeStr) {
    return {}
  }

  // xmltv_ns format: "season.episode.part" (0-indexed)
  const xmltvNsMatch = episodeStr.match(/^(\d+)\.(\d+)/)
  if (xmltvNsMatch) {
    return {
      season: parseInt(xmltvNsMatch[1], 10) + 1,
      episode: parseInt(xmltvNsMatch[2], 10) + 1,
    }
  }

  // Simple episode number
  const simpleMatch = episodeStr.match(/^(\d+)$/)
  if (simpleMatch) {
    return { episode: parseInt(simpleMatch[1], 10) + 1 }
  }

  // SxxExx format
  const sxxexxMatch = episodeStr.match(/S(\d+)E(\d+)/i)
  if (sxxexxMatch) {
    return {
      season: parseInt(sxxexxMatch[1], 10),
      episode: parseInt(sxxexxMatch[2], 10),
    }
  }

  return {}
}

/**
 * Extract text content from an XML element string
 */
function extractElementText(xml: string, tagName: string): string | undefined {
  const regex = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, 'i')
  const match = xml.match(regex)
  return match ? decodeXMLEntities(match[1].trim()) : undefined
}

/**
 * Extract attribute value from an XML element
 */
function extractAttribute(
  element: string,
  attrName: string
): string | undefined {
  const regex = new RegExp(`${attrName}="([^"]*)"`, 'i')
  const match = element.match(regex)
  return match ? decodeXMLEntities(match[1]) : undefined
}

/**
 * Decode common XML entities
 */
function decodeXMLEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCharCode(parseInt(code, 16))
    )
}

/**
 * Parse XMLTV channel element
 */
function parseChannel(channelXml: string): XMLTVChannel | null {
  const id = extractAttribute(channelXml, 'id')
  if (!id) return null

  const displayName =
    extractElementText(channelXml, 'display-name') ||
    extractElementText(channelXml, 'name') ||
    id

  const iconMatch = channelXml.match(/<icon[^>]*src="([^"]*)"[^>]*\/?>/i)
  const icon = iconMatch ? decodeXMLEntities(iconMatch[1]) : undefined

  return { id, displayName, icon }
}

/**
 * Parse XMLTV programme element
 */
function parseProgramme(programmeXml: string): XMLTVProgram | null {
  const channel = extractAttribute(programmeXml, 'channel')
  const start = extractAttribute(programmeXml, 'start')
  const stop = extractAttribute(programmeXml, 'stop')
  const title = extractElementText(programmeXml, 'title')

  if (!channel || !start || !stop || !title) {
    return null
  }

  const desc = extractElementText(programmeXml, 'desc')
  const category = extractElementText(programmeXml, 'category')
  const episodeNum = extractElementText(programmeXml, 'episode-num')
  const rating = extractElementText(programmeXml, 'rating')

  const iconMatch = programmeXml.match(/<icon[^>]*src="([^"]*)"[^>]*\/?>/i)
  const icon = iconMatch ? decodeXMLEntities(iconMatch[1]) : undefined

  return {
    channel,
    start,
    stop,
    title,
    desc,
    category,
    icon,
    episodeNum,
    rating,
  }
}

/**
 * Parse raw XMLTV XML string into structured data
 */
export function parseXMLTV(xmlContent: string): XMLTVData {
  const channels: XMLTVChannel[] = []
  const programs: XMLTVProgram[] = []

  // Parse channels
  const channelRegex = /<channel[^>]*>[\s\S]*?<\/channel>/gi
  let channelMatch
  while ((channelMatch = channelRegex.exec(xmlContent)) !== null) {
    const channel = parseChannel(channelMatch[0])
    if (channel) {
      channels.push(channel)
    }
  }

  // Parse programmes
  const programmeRegex = /<programme[^>]*>[\s\S]*?<\/programme>/gi
  let programmeMatch
  while ((programmeMatch = programmeRegex.exec(xmlContent)) !== null) {
    const programme = parseProgramme(programmeMatch[0])
    if (programme) {
      programs.push(programme)
    }
  }

  return { channels, programs }
}

/**
 * Convert parsed XMLTV data to normalized EPG data format
 */
export function xmltvToEPGData(xmltvData: XMLTVData, source?: string): EPGData {
  const programsByChannel: Record<string, Program[]> = {}

  for (const xmltvProgram of xmltvData.programs) {
    const { season, episode } = parseEpisodeNum(xmltvProgram.episodeNum)

    const program: Program = {
      id: `${xmltvProgram.channel}-${xmltvProgram.start}`,
      channelId: xmltvProgram.channel,
      title: xmltvProgram.title,
      description: xmltvProgram.desc,
      startTime: parseXMLTVDate(xmltvProgram.start),
      endTime: parseXMLTVDate(xmltvProgram.stop),
      category: xmltvProgram.category,
      image: xmltvProgram.icon,
      seasonNumber: season,
      episodeNumber: episode,
      rating: xmltvProgram.rating,
    }

    if (!programsByChannel[xmltvProgram.channel]) {
      programsByChannel[xmltvProgram.channel] = []
    }
    programsByChannel[xmltvProgram.channel].push(program)
  }

  // Sort programs by start time for each channel
  for (const channelId of Object.keys(programsByChannel)) {
    programsByChannel[channelId].sort((a, b) => {
      const startA = new Date(a.startTime).getTime()
      const startB = new Date(b.startTime).getTime()
      return startA - startB
    })
  }

  return {
    programs: programsByChannel,
    lastUpdated: new Date().toISOString(),
    source,
  }
}

/**
 * Parse XMLTV content and return normalized EPG data
 */
export function parseXMLTVToEPG(xmlContent: string, source?: string): EPGData {
  const xmltvData = parseXMLTV(xmlContent)
  return xmltvToEPGData(xmltvData, source)
}

/**
 * Get channel mapping from XMLTV data
 * Returns a map of channel ID to display name and icon
 */
export function getChannelMapping(
  xmltvData: XMLTVData
): Map<string, { name: string; icon?: string }> {
  const mapping = new Map<string, { name: string; icon?: string }>()

  for (const channel of xmltvData.channels) {
    mapping.set(channel.id, {
      name: channel.displayName,
      icon: channel.icon,
    })
  }

  return mapping
}
