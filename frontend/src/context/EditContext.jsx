import React, { createContext, useContext, useState } from 'react'

const EditUserContext = createContext(null)

export const EditUserProvider = ({children}) => {
    const [isEditUser, setEditUser] = useState(false);
    const openEdit = () => setEditUser(true);
    const closeEdit = () => setEditUser(false);

    return (
        <EditUserContext.Provider value={{isEditUser, openEdit, closeEdit}}>
            {children}
        </EditUserContext.Provider>
    )
}

export const useEditUserContext = () => {
    const context = useContext(EditUserContext);
    if (!context) {
        throw new Error("useEditUserContext must be used inside EditUserProvider")
    }
    return context;
}