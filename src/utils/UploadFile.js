export const uploadFile = async(file, communityId, supabase) => {
    const ext = file.name.split('.').pop();
    const path = `${communityId}/${crypto.randomUUID()}.${ext}`;
    const {error} = await supabase.storage.from('chat-files')
        .upload(path, file, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false
        })
    if(error) console.log(error);

    const {data} = await supabase.storage.from('chat-files')
          .getPublicUrl(path);
    
    return {
        url: data.publicUrl,
        name: file.name,
        size: file.size,
        type: file.type
    }
}