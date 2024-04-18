import { Button, Html, Head, Font, Preview, Heading, Row,Section, Text } from "@react-email/components";
import * as React from "react";

interface VerificatonEmailProps{
    username:string,
    otp:string
}

export default function VerificationEmail({username,otp}:VerificatonEmailProps) {
  return (
    <Html>
     <Head>
        <title>Verification Code</title>
        <Font fontFamily="Roboto" fallbackFontFamily={"Verdana"}></Font>
     </Head>
     <Preview>Your six didgit OTP is: {otp}</Preview>
     <Section><Heading>
        Hello {username}</Heading></Section>
     <Row><Heading>
        Thankyou for registering</Heading></Row>
    </Html>
  );
}
