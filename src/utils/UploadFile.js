// export const uploadFile = async(file, communityId, supabase) => {
//     const ext = file.name.split('.').pop();
//     const path = `${communityId}/${crypto.randomUUID()}.${ext}`;
//     const {error} = await supabase.storage.from('chat-files')
//         .upload(path, file, {
//             contentType: file.type,
//             cacheControl: '3600',
//             upsert: false
//         })
//     if(error) console.log(error);

//     const {data} = await supabase.storage.from('chat-files')
//           .getPublicUrl(path);
    
//     return {
//         url: data.publicUrl,
//         name: file.name,
//         size: file.size,
//         type: file.type
//     }
// // }
// export const uploadFile = async (file, supabase) => {
//   const ext = file.name.split('.').pop().toLowerCase();
//   const fileName = `${crypto.randomUUID()}.${ext}`;

//   const mimeTypes = {
//     jpg: 'image/jpeg',
//     jpeg: 'image/jpeg',
//     png: 'image/png',
//     webp: 'image/webp'
//   };

//   const contentType = mimeTypes[ext] || 'image/png';

//   const filePath = `public/${fileName}`; // ✅ FIX

//   const { error } = await supabase.storage
//     .from('images')
//     .upload(filePath, file, {
//       contentType,
//       cacheControl: '3600',
//       upsert: false
//     });

//   if (error) throw error;

//   const { data } = supabase.storage
//     .from('images')
//     .getPublicUrl(filePath); // ✅ FIX

//   return { url: data.publicUrl };
// };

export const uploadFile = async (file, supabase) => {
  const ext = file.name.split('.').pop().toLowerCase();
  const fileName = `${crypto.randomUUID()}.${ext}`;

  const mimeTypes = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp'
  };

  const contentType = mimeTypes[ext] || 'image/png';

  // 🔥 FORCE TRUE FILE (CRITICAL FIX)
  const cleanFile = new File([file], file.name, {
    type: file.type || contentType,
  });

  const { error } = await supabase.storage
    .from('images')
    .upload(`public/${fileName}`, cleanFile, {
      contentType,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from('images')
    .getPublicUrl(`public/${fileName}`);

  return { url: data.publicUrl };
};