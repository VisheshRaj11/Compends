
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY


export const createSupabaseClient = (getToken) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: async (url, options = {}) => {
        const token = await getToken({ template: "supabase" });
        // console.log(token)
        return fetch(url, {
          ...options,
          headers: {
            Accept: "application/json",

            // 🔥 FIX HERE
            ...(options.body instanceof File ||
            options.body instanceof Blob ||
            options.body instanceof FormData
              ? {}
              : { "Content-Type": "application/json" }),

            ...options.headers,
            apikey: supabaseAnonKey,
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        });
      },
    },
    
      realtime: {
       url: 'wss://clddjjpfepkybslxugyv.jiobase.com/realtime/v1',
    },
    
  });
};


// export const createSupabaseClient = (getToken) => {
//   return createClient(supabaseUrl, supabaseAnonKey, {
//     global: {
//       fetch: async (url, options = {}) => {
//         const token = await getToken({ template: "supabase" })

//         return fetch(url, {
//           ...options,
//           headers: {
//              Accept: "application/json",
//             "Content-Type": "application/json",
//             ...options.headers,
//             apikey: supabaseAnonKey,
//             Authorization: token ? `Bearer ${token}` : undefined,
//           },
//         })
//       },
//     },
//   })
// }


// import { createClient } from "@supabase/supabase-js";

// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// // 🔥 ADD THIS
// const PROXY_BASE = "https://supabase-proxy.visheshraj47.workers.dev/supabase";

// export const createSupabaseClient = (getToken) => {
//   return createClient(supabaseUrl, supabaseAnonKey, {
//     global: {
//       fetch: async (url, options = {}) => {
//         const token = await getToken({ template: "supabase" });

//         // ✅ IMPORTANT: route through proxy
//         const proxyUrl = url.replace(supabaseUrl, PROXY_BASE);

//         return fetch(proxyUrl, {
//           ...options,
//           headers: {
//             Accept: "application/json",

//             ...(options.body instanceof File ||
//             options.body instanceof Blob ||
//             options.body instanceof FormData
//               ? {}
//               : { "Content-Type": "application/json" }),

//             ...options.headers,

//             // ✅ required
//             apikey: supabaseAnonKey,

//             // ⚠️ TEMP: REMOVE THIS FOR TEST
//             // Authorization: token ? `Bearer ${token}` : undefined,
//           },
//         });
//       },
//     },
//   });
// };