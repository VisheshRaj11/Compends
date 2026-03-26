import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const createSupabaseClient = (getToken) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: async (url, options = {}) => {
        const token = await getToken({ template: "supabase" });

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
  });
};

// export const createSupabaseClient = (getToken) => {
//   return createClient(supabaseUrl, supabaseAnonKey, {
//     global: {
//       fetch: async (url, options = {}) => {
//         const token = await getToken({ template: "supabase" });

//         const headers = new Headers(options.headers || {});

//         // ✅ Always attach auth
//         headers.set("apikey", supabaseAnonKey);
//         if (token) {
//           headers.set("Authorization", `Bearer ${token}`);
//         }

//         // 🔥 Detect body type SAFELY
//         const body = options.body;

//         const isFileUpload =
//           body instanceof Blob ||
//           body instanceof File ||
//           body instanceof FormData;

//         const isJSON =
//           typeof body === "string" &&
//           headers.get("Content-Type") !== "application/json";

//         // ✅ Only set JSON headers when appropriate
//         if (!isFileUpload && body) {
//           headers.set("Content-Type", "application/json");
//           headers.set("Accept", "application/json");
//         }

//         return fetch(url, {
//           ...options,
//           headers,
//         });
//       },
//     },
//   });
// };

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

// // export const createSupabaseClient = (getToken) => {
// //   return createClient(supabaseUrl, supabaseAnonKey, {
// //     global: {
// //       fetch: async (url, options = {}) => {
// //         const token = await getToken({ template: "supabase" });

// //         const headers = new Headers(options.headers || {});

// //         // ✅ Always set auth
// //         headers.set("apikey", supabaseAnonKey);
// //         if (token) {
// //           headers.set("Authorization", `Bearer ${token}`);
// //         }

// //         // 🔥 ONLY set JSON header when it's actually JSON
// //         const isBodyJSON =
// //           options.body &&
// //           typeof options.body === "string" &&
// //           options.body.startsWith("{");

// //         if (isBodyJSON) {
// //           headers.set("Content-Type", "application/json");
// //           headers.set("Accept", "application/json");
// //         }

// //         return fetch(url, {
// //           ...options,
// //           headers,
// //         });
// //       },
// //     },
// //   });
// // };

// export const createSupabaseClient = (getToken) => {
//   return createClient(supabaseUrl, supabaseAnonKey, {
//     global: {
//       fetch: async (url, options = {}) => {
//         const token = await getToken({ template: "supabase" });

//         // 🚨 DO NOT override headers blindly
//         const headers = new Headers(options.headers || {});

//         if (token) {
//           headers.set("Authorization", `Bearer ${token}`);
//         }

//         headers.set("apikey", supabaseAnonKey);

//         return fetch(url, {
//           ...options,
//           headers,
//         });
//       },
//     },
//   });
// };
