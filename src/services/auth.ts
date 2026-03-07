import { supabase } from "@/lib/supabase";

// Sign up a new user
export async function signUp(email: string, username: string, password: string, refcode: string) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });
    alert(JSON.stringify(data));
    const { data: userData, error: userError } = await supabase
        .from("users")
        .insert({
            id: data.user?.id,
            email,
            username,
            refcode
        });

    if (userError) {
        console.error(userError);
    }

    if (error) {
        alert(error.message);
        throw new Error(error.message);
    }

    return data;
}

// Login existing user
export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return {error};
        // throw new Error(error.message);
    }
}

// Logout user
export async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
        throw new Error(error.message);
    }
}

// Get current logged in user
export async function getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
        throw new Error(error.message);
    }

    return data.user;
}
