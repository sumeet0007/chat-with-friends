import React, { useState, useCallback } from "react";
import { Text, TextInput, TouchableOpacity, View, Image, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useSignIn } from "@clerk/clerk-expo";
import { useRouter, Link } from "expo-router";
import { useGoogleOAuth } from "@/hooks/use-google-oauth";

export default function SignInScreen() {
    const { signIn, setActive, isLoaded } = useSignIn();
    const { signInWithGoogle } = useGoogleOAuth();
    const router = useRouter();

    const [emailAddress, setEmailAddress] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const onSignInPress = useCallback(async () => {
        if (!isLoaded) return;
        setLoading(true);
        setError("");

        try {
            const completeSignIn = await signIn.create({
                identifier: emailAddress,
                password,
            });

            await setActive({ session: completeSignIn.createdSessionId });
            router.replace("/(tabs)");
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2));
            setError(err.errors?.[0]?.message || "Invalid email or password");
        } finally {
            setLoading(false);
        }
    }, [isLoaded, emailAddress, password, signIn, setActive, router]);

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-[#313338]">
                <View className="flex-1 px-6 pt-20 pb-10">
                    <View className="items-center mb-10">
                        {/* Discord-like Logo Placeholder */}
                        <View className="w-16 h-16 bg-[#5865F2] rounded-2xl items-center justify-center mb-4">
                            <Text className="text-white text-3xl font-bold">D</Text>
                        </View>
                        <Text className="text-white text-3xl font-bold tracking-tight">Welcome back!</Text>
                        <Text className="text-[#B5BAC1] text-lg text-center mt-2">
                            We're so excited to see you again!
                        </Text>
                    </View>

                    <View className="space-y-6">
                        <View>
                            <Text className="text-[#B5BAC1] text-xs font-bold uppercase mb-2">
                                Account Information
                            </Text>
                            <View className="space-y-4">
                                <View>
                                    <Text className="text-[#B5BAC1] text-[10px] font-bold uppercase mb-1">
                                        Email or Phone Number
                                    </Text>
                                    <TextInput
                                        autoCapitalize="none"
                                        value={emailAddress}
                                        placeholderTextColor="#4E5058"
                                        className="bg-[#1E1F22] text-[#DBDEE1] p-4 rounded-md font-medium"
                                        onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
                                    />
                                </View>

                                <View>
                                    <Text className="text-[#B5BAC1] text-[10px] font-bold uppercase mb-1">
                                        Password
                                    </Text>
                                    <TextInput
                                        value={password}
                                        placeholderTextColor="#4E5058"
                                        className="bg-[#1E1F22] text-[#DBDEE1] p-4 rounded-md font-medium"
                                        secureTextEntry={true}
                                        onChangeText={(password) => setPassword(password)}
                                    />
                                </View>
                            </View>
                        </View>

                        {error ? (
                            <Text className="text-[#F23F42] text-sm font-medium">{error}</Text>
                        ) : null}

                        <TouchableOpacity 
                            onPress={onSignInPress}
                            disabled={loading}
                            className={`bg-[#5865F2] p-4 rounded-md items-center mt-2 ${loading ? 'opacity-50' : 'opacity-100'}`}
                        >
                            <Text className="text-white font-bold text-lg">
                                {loading ? "Logging in..." : "Log In"}
                            </Text>
                        </TouchableOpacity>

                        <View className="flex-row items-center my-4">
                            <View className="flex-1 h-[1px] bg-[#4E5058]" />
                            <Text className="text-[#B5BAC1] text-[10px] font-bold uppercase mx-4">OR</Text>
                            <View className="flex-1 h-[1px] bg-[#4E5058]" />
                        </View>

                        <TouchableOpacity 
                            onPress={signInWithGoogle}
                            className="bg-white p-4 rounded-md flex-row items-center justify-center"
                        >
                            <Image 
                                source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" }} 
                                className="w-5 h-5 mr-3"
                                style={{ width: 20, height: 20 }}
                            />
                            <Text className="text-[#313338] font-bold text-base">Continue with Google</Text>
                        </TouchableOpacity>

                        <View className="flex-row items-center mt-4">
                            <Text className="text-[#B5BAC1] text-sm">Need an account? </Text>
                            <Link href="/(auth)/sign-up" asChild>
                                <TouchableOpacity>
                                    <Text className="text-[#00A8FC] text-sm font-medium">Register</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
