import config from "../config";
import { transporter } from "../lib/nodemailer";

interface IEmailPayload {
  to: string;
  subject: string;
  data: string;
}

export const sendCommonEmail = async (payload: IEmailPayload) => {
  await transporter.sendMail({
    from: `"SwiftCourier" <${config.email_sender}>`,
    to: payload.to,
    subject: payload.subject,
    html: payload.data,
  });
};

// export const sendCommonEmail = async (payload: IEmailPayload) => {
//   try {
//     const info = await transporter.sendMail({
//       from: `"SwiftCourier" <${config.email_sender}>`,
//       to: payload.to,
//       subject: payload.subject,
//       html: payload.data,
//     });
//     console.log("Email sent successfully:", {
//       messageId: info.messageId,
//       response: info.response,
//       to: payload.to,
//     });
//     return info;
//   } catch (error) {
//     console.error("Failed to send email:", error);
//     throw error;
//   }
// };
