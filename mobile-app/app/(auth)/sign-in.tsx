import React, { useState, useCallback } from "react";
import { Text, TextInput, TouchableOpacity, View, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { useSignIn } from "@clerk/clerk-expo";
import { useRouter, Link } from "expo-router";
import { useGoogleOAuth } from "@/hooks/use-google-oauth";
import * as Haptics from 'expo-haptics';

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

        const trimmedIdentifier = emailAddress.trim();
        if (!trimmedIdentifier) {
            setError("Please enter your email or username.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const completeSignIn = await signIn.create({
                identifier: trimmedIdentifier,
                password,
            });

            console.log("SignIn Status:", completeSignIn.status);

            if (completeSignIn.status === "complete") {
                await setActive({ session: completeSignIn.createdSessionId });
                Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Success);

                // Small delay to ensure session propagation
                setTimeout(() => {
                    router.replace("/(tabs)");
                }, 500);
            } else {
                console.log("Incomplete sign-in:", JSON.stringify(completeSignIn, null, 2));
                setError("Your account requires further verification. Please check your email.");
            }
        } catch (err: any) {
            console.error("SignIn Error:", JSON.stringify(err, null, 2));
            const clerkError = err.errors?.[0];

            // Specifically check for format invalid vs other errors
            if (clerkError?.code === "form_param_format_invalid") {
                setError("That email or username doesn't look right. Please check for typos.");
            } else {
                setError(clerkError?.longMessage || clerkError?.message || "Invalid email or password");
            }

            Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Error);
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
                        <View className="w-20 h-20 bg-[#5865F2] rounded-3xl items-center justify-center mb-4 shadow-xl shadow-[#5865F2]/40">
                            <Text className="text-white text-4xl font-black italic">D</Text>
                        </View>
                        <Text className="text-white text-3xl font-[900] tracking-tighter">Welcome back!</Text>
                        <Text className="text-[#B5BAC1] text-base text-center mt-2 font-medium">
                            We're so excited to see you again!
                        </Text>
                    </View>

                    <View className="space-y-6">
                        <View className="space-y-4">
                            <View>
                                <Text className="text-[#B5BAC1] text-[10px] font-black uppercase mb-1.5 ml-1">
                                    Email or Username
                                </Text>
                                <TextInput
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    keyboardType="email-address"
                                    value={emailAddress}
                                    placeholder="email@example.com"
                                    placeholderTextColor="#4E5058"
                                    className="bg-[#1E1F22] text-[#DBDEE1] p-4 rounded-xl font-bold border border-white/5"
                                    onChangeText={(val) => setEmailAddress(val)}
                                />
                            </View>

                            <View>
                                <Text className="text-[#B5BAC1] text-[10px] font-black uppercase mb-1.5 ml-1">
                                    Password
                                </Text>
                                <TextInput
                                    value={password}
                                    placeholder="••••••••"
                                    placeholderTextColor="#4E5058"
                                    className="bg-[#1E1F22] text-[#DBDEE1] p-4 rounded-xl font-bold border border-white/5"
                                    secureTextEntry={true}
                                    onChangeText={(val) => setPassword(val)}
                                />
                                <TouchableOpacity className="mt-2 ml-1">
                                    <Text className="text-[#00A8FC] text-xs font-bold">Forgot your password?</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {error ? (
                            <View className="bg-[#F23F42]/10 p-3 rounded-lg border border-[#F23F42]/20">
                                <Text className="text-[#F23F42] text-xs font-bold text-center">{error}</Text>
                            </View>
                        ) : null}

                        <TouchableOpacity 
                            onPress={onSignInPress}
                            disabled={loading}
                            className={`bg-[#5865F2] p-4 rounded-xl items-center mt-2 shadow-lg shadow-[#5865F2]/30 ${loading ? 'opacity-50' : 'opacity-100'}`}
                        >
                            {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-lg">Log In</Text>}
                        </TouchableOpacity>

                        <View className="flex-row items-center my-4">
                            <View className="flex-1 h-[1px] bg-[#4E5058]/50" />
                            <Text className="text-[#B5BAC1] text-[10px] font-black uppercase mx-4">or</Text>
                            <View className="flex-1 h-[1px] bg-[#4E5058]/50" />
                        </View>

                        <TouchableOpacity 
                            onPress={signInWithGoogle}
                            className="bg-white p-4 rounded-xl flex-row items-center justify-center border border-zinc-200"
                        >
                            <Image 
                                source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" }} 
                                className="w-5 h-5 mr-3"
                                style={{ width: 20, height: 20 }}
                            />
                            <Text className="text-[#313338] font-bold text-base">Continue with Google</Text>
                        </TouchableOpacity>

                        <View className="flex-row items-center justify-center mt-4">
                            <Text className="text-[#B5BAC1] text-sm font-medium">Need an account? </Text>
                            <Link href="/(auth)/sign-up" asChild>
                                <TouchableOpacity>
                                    <Text className="text-[#00A8FC] text-sm font-black">Register</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
