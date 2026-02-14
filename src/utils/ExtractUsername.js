export const extractUsername = (link) => {
   try {
     const url = new URL(link);
     const parts = url.pathname.split('/').filter(p => p);
    // handles /u/username and /username
    if(parts[0] == 'u' && parts.length >= 2) return parts[1];
    // else: "https://leetcode.com/john_doe"
    return parts[0];
   } catch (e) {
        return null;
   }
}

// Url class behind the sceene:
// url.href      // "https://leetcode.com/u/john_doe/"
// url.protocol  // "https:"
// url.hostname  // "leetcode.com"
// url.pathname  // "/u/john_doe/"
// url.search    // ""
// url.hash      // ""