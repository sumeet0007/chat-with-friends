import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View, Image, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter, Link } from "expo-router";
import { useGoogleOAuth } from "@/hooks/use-google-oauth";

export default function SignUpScreen() {
    const { isLoaded, signUp, setActive } = useSignUp();
    const { signInWithGoogle } = useGoogleOAuth();
    const router = useRouter();

    const [emailAddress, setEmailAddress] = useState("");
    const [password, setPassword] = useState("");
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const onSignUpPress = async () => {
        if (!isLoaded) return;
        setLoading(true);
        setError("");

        try {
            await signUp.create({
                emailAddress,
                password,
            });

            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
            setPendingVerification(true);
        } catch (err: any) {
            console.error(err);
            setError(err.errors?.[0]?.message || "There was a problem signing up.");
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

            await setActive({ session: completeSignUp.createdSessionId });
            router.replace("/(tabs)");
        } catch (err: any) {
            console.error(err);
            setError(err.errors?.[0]?.message || "Invalid verification code.");
        } finally {
            setLoading(false);
        }
    };

    if (pendingVerification) {
        return (
            <View className="flex-1 bg-[#313338] px-6 pt-20">
                <View className="items-center mb-10">
                    <Text className="text-white text-3xl font-bold">Check your email</Text>
                    <Text className="text-[#B5BAC1] text-lg text-center mt-2">
                        Enter the verification code sent to {emailAddress}
                    </Text>
                </View>

                <View className="space-y-4">
                    <View>
                        <Text className="text-[#B5BAC1] text-[10px] font-bold uppercase mb-1">
                            Verification Code
                        </Text>
                        <TextInput
                            value={code}
                            placeholderTextColor="#4E5058"
                            className="bg-[#1E1F22] text-[#DBDEE1] p-4 rounded-md font-medium"
                            onChangeText={(code) => setCode(code)}
                        />
                    </View>

                    {error ? (
                        <Text className="text-[#F23F42] text-sm font-medium">{error}</Text>
                    ) : null}

                    <TouchableOpacity 
                        onPress={onPressVerify}
                        disabled={loading}
                        className={`bg-[#5865F2] p-4 rounded-md items-center mt-2 ${loading ? 'opacity-50' : 'opacity-100'}`}
                    >
                        <Text className="text-white font-bold text-lg">Verify Email</Text>
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
                        <View className="w-16 h-16 bg-[#5865F2] rounded-2xl items-center justify-center mb-4">
                            <Text className="text-white text-3xl font-bold">D</Text>
                        </View>
                        <Text className="text-white text-3xl font-bold tracking-tight">Create an account</Text>
                        <Text className="text-[#B5BAC1] text-lg text-center mt-2">
                            Join over 100 million people on Discord!
                        </Text>
                    </View>

                    <View className="space-y-6">
                        <View className="space-y-4">
                            <View>
                                <Text className="text-[#B5BAC1] text-[10px] font-bold uppercase mb-1">
                                    Email
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

                        {error ? (
                            <Text className="text-[#F23F42] text-sm font-medium">{error}</Text>
                        ) : null}

                        <TouchableOpacity 
                            onPress={onSignUpPress}
                            disabled={loading}
                            className={`bg-[#5865F2] p-4 rounded-md items-center mt-2 ${loading ? 'opacity-50' : 'opacity-100'}`}
                        >
                            <Text className="text-white font-bold text-lg">
                                {loading ? "Creating..." : "Continue"}
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
                            <Text className="text-[#313338] font-bold text-base">Register with Google</Text>
                        </TouchableOpacity>

                        <View className="flex-row items-center mt-4">
                            <Text className="text-[#B5BAC1] text-sm">Already have an account? </Text>
                            <Link href="/(auth)/sign-in" asChild>
                                <TouchableOpacity>
                                    <Text className="text-[#00A8FC] text-sm font-medium">Log In</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                        
                        <Text className="text-[#B5BAC1] text-[10px] mt-4 leading-4">
                            By registering, you agree to Discord's <Text className="text-[#00A8FC]">Terms of Service</Text> and <Text className="text-[#00A8FC]">Privacy Policy</Text>.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
