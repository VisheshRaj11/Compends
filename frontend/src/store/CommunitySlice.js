import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    id:null
};

// Example: state = {
        //   currentCommunity: {
        //     id: "abc123"
        //   }
        // }

const communitySlice = createSlice({
    name:'currentCommunity',
    initialState,
    reducers: {
        //These are actions:
        setCommunity: (state, action) => {
            state.id = action.payload;
        },
        clearCommunity: (state) => {
            state.id = null;
        }
    }
});

export const {setCommunity, clearCommunity} = communitySlice.actions;
export default communitySlice.reducer;