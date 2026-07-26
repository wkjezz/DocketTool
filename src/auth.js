const PERMITTED_DISCORD_ID = '1006310774035206244';

export function normalizeDiscordId(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

export function isDiscordUserAuthorized(discordId) {
  return normalizeDiscordId(discordId) === PERMITTED_DISCORD_ID;
}
