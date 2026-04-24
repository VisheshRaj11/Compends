import { configureStore } from "@reduxjs/toolkit";
import communityReducer from './CommunitySlice'

export const store = configureStore({
    reducer:{
        currentCommunity: communityReducer
    }
})