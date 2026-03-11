import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { useSignUp, useClerk } from "@clerk/clerk-expo";
import { useRouter, Link } from "expo-router";
import { useGoogleOAuth } from "@/hooks/use-google-oauth";
import * as Haptics from 'expo-haptics';

export default function SignUpScreen() {
    const { isLoaded, signUp, setActive } = useSignUp();
    const { signOut } = useClerk();
    const { signInWithGoogle } = useGoogleOAuth();
    const router = useRouter();

    const [emailAddress, setEmailAddress] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const onSignUpPress = async () => {
        if (!isLoaded) return;
        setLoading(true);
        setError("");

        try {
            // Discord usually requires a username.
            // If your Clerk settings don't have username enabled, this will ignore it.
            await signUp.create({
                emailAddress,
                password,
                username: username || undefined,
                firstName: firstName || undefined,
                lastName: lastName || undefined,
            });

            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
            setPendingVerification(true);
            Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Success);
        } catch (err: any) {
            console.error("SignUp Error:", JSON.stringify(err, null, 2));
            const errorMessage = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || "There was a problem signing up.";
            
            // If Clerk's local client state gets corrupted/orphaned
            if (errorMessage.includes("No sign up attempt was found") || errorMessage.includes("GET request for this client") || err.errors?.[0]?.code === "client_state_invalid") {
                import("@/lib/token-cache").then(({ tokenCache }) => {
                    tokenCache.saveToken("__clerk_client_jwt", "");
                });
                try { await signOut(); } catch (e) {}
                setError("Your session expired. We have refreshed it. Please press Continue again.");
            } else if (err.errors?.[0]?.code === "form_identifier_exists") {
                setError("This email is already registered (it might be unverified from your previous attempt). Please Log In instead, or use a different email to register.");
            } else {
                setError(errorMessage);
            }
            
            Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Error);
        } finally {
            setLoading(false);
        }
    };

    const onPressVerify = async () => {
        if (!isLoaded) return;
        setLoading(true);
        setError("");

        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code,
            });

            if (completeSignUp.status !== 'complete') {
                console.log("SignUp Incomplete:", JSON.stringify(completeSignUp, null, 2));
                setError("Verification successful, but more information is required. Please check your Clerk dashboard settings.");
                return;
            }

            console.log("SignUp Complete. Setting active session...");

            // ENSURE WE WAIT FOR THIS TO FINISH
            await setActive({ session: completeSignUp.createdSessionId });

            // Give Clerk a moment to propagate the session
            setTimeout(() => {
                router.replace("/(tabs)");
            }, 500);

        } catch (err: any) {
            console.error("Verification Error:", JSON.stringify(err, null, 2));
            const errorMessage = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || "Invalid verification code.";
            
            // If Clerk's local client state gets corrupted/orphaned
            if (errorMessage.includes("No sign up attempt was found") || errorMessage.includes("GET request for this client")) {
                import("@/lib/token-cache").then(({ tokenCache }) => {
                    tokenCache.saveToken("__clerk_client_jwt", "");
                });
                try { await signOut(); } catch (e) {}
                setError("Your session expired. Please go back and resubmit your details to receive a new code.");
            } else {
                setError(errorMessage);
            }
            
            Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Error);
        } finally {
            setLoading(false);
        }
    };

    if (pendingVerification) {
        return (
            <View className="flex-1 bg-[#313338] px-6 pt-20">
                <View className="items-center mb-10">
                    <Text className="text-white text-3xl font-bold">Verify your email</Text>
                    <Text className="text-[#B5BAC1] text-lg text-center mt-2">
                        We sent a 6-digit code to{"\n"}
                        <Text className="text-white font-bold">{emailAddress}</Text>
                    </Text>
                </View>

                <View className="space-y-4">
                    <View>
                        <Text className="text-[#B5BAC1] text-[10px] font-bold uppercase mb-2 ml-1">
                            Verification Code
                        </Text>
                        <TextInput
                            value={code}
                            placeholder="123456"
                            placeholderTextColor="#4E5058"
                            className="bg-[#1E1F22] text-[#DBDEE1] p-4 rounded-xl font-bold text-center text-2xl tracking-[10px]"
                            keyboardType="number-pad"
                            maxLength={6}
                            onChangeText={(code) => setCode(code)}
                        />
                    </View>

                    {error ? (
                        <View className="bg-[#F23F42]/10 p-3 rounded-lg border border-[#F23F42]/20">
                            <Text className="text-[#F23F42] text-xs font-bold text-center">{error}</Text>
                        </View>
                    ) : null}

                    <TouchableOpacity 
                        onPress={onPressVerify}
                        disabled={loading}
                        className={`bg-[#5865F2] p-4 rounded-xl items-center mt-4 shadow-lg shadow-[#5865F2]/30 ${loading ? 'opacity-50' : 'opacity-100'}`}
                    >
                        {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-lg">Verify Account</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setPendingVerification(false)}
                        className="mt-4 items-center"
                    >
                        <Text className="text-[#B5BAC1] text-sm font-bold">Edit Email Address</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

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
                        <Text className="text-white text-3xl font-[900] tracking-tighter">Create an account</Text>
                        <Text className="text-[#B5BAC1] text-base text-center mt-2 font-medium">
                            Join the conversation!
                        </Text>
                    </View>

                    <View className="space-y-5">
                        <View className="flex-row space-x-4">
                            <View className="flex-1">
                                <Text className="text-[#B5BAC1] text-[10px] font-black uppercase mb-1.5 ml-1">
                                    First Name
                                </Text>
                                <TextInput
                                    value={firstName}
                                    placeholder="John"
                                    placeholderTextColor="#4E5058"
                                    className="bg-[#1E1F22] text-[#DBDEE1] p-4 rounded-xl font-bold border border-white/5"
                                    onChangeText={(val) => setFirstName(val)}
                                />
                            </View>
                            <View className="w-4" />
                            <View className="flex-1">
                                <Text className="text-[#B5BAC1] text-[10px] font-black uppercase mb-1.5 ml-1">
                                    Last Name
                                </Text>
                                <TextInput
                                    value={lastName}
                                    placeholder="Doe"
                                    placeholderTextColor="#4E5058"
                                    className="bg-[#1E1F22] text-[#DBDEE1] p-4 rounded-xl font-bold border border-white/5"
                                    onChangeText={(val) => setLastName(val)}
                                />
                            </View>
                        </View>

                        <View>
                            <Text className="text-[#B5BAC1] text-[10px] font-black uppercase mb-1.5 ml-1">
                                Username (Optional)
                            </Text>
                            <TextInput
                                autoCapitalize="none"
                                value={username}
                                placeholder="cooluser123"
                                placeholderTextColor="#4E5058"
                                className="bg-[#1E1F22] text-[#DBDEE1] p-4 rounded-xl font-bold border border-white/5"
                                onChangeText={(val) => setUsername(val)}
                            />
                        </View>

                        <View>
                            <Text className="text-[#B5BAC1] text-[10px] font-black uppercase mb-1.5 ml-1">
                                Email
                            </Text>
                            <TextInput
                                autoCapitalize="none"
                                value={emailAddress}
                                placeholder="email@example.com"
                                placeholderTextColor="#4E5058"
                                className="bg-[#1E1F22] text-[#DBDEE1] p-4 rounded-xl font-bold border border-white/5"
                                onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
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
                                onChangeText={(password) => setPassword(password)}
                            />
                        </View>

                        {error ? (
                            <View className="bg-[#F23F42]/10 p-3 rounded-lg border border-[#F23F42]/20">
                                <Text className="text-[#F23F42] text-xs font-bold text-center">{error}</Text>
                            </View>
                        ) : null}

                        <TouchableOpacity 
                            onPress={onSignUpPress}
                            disabled={loading}
                            className={`bg-[#5865F2] p-4 rounded-xl items-center mt-2 shadow-lg shadow-[#5865F2]/30 ${loading ? 'opacity-50' : 'opacity-100'}`}
                        >
                            {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-lg">Continue</Text>}
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
                            <Text className="text-[#313338] font-bold text-base">Register with Google</Text>
                        </TouchableOpacity>

                        <View className="flex-row items-center justify-center mt-4">
                            <Text className="text-[#B5BAC1] text-sm font-medium">Already have an account? </Text>
                            <Link href="/(auth)/sign-in" asChild>
                                <TouchableOpacity>
                                    <Text className="text-[#00A8FC] text-sm font-black">Log In</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
