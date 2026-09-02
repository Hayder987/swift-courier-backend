import path from "node:path";
import ejs from "ejs";
import { sendCommonEmail } from "./sendCommonEmail";


interface ITemplateEmailPayload<T> {
	to: string;
	subject: string;
	templateName: string;
	data: T;
}

export const sendTemplateEmail = async <T extends Record<string, unknown>>(
	payload: ITemplateEmailPayload<T>,
) => {
	const templatePath = path.join(
		process.cwd(),
		`src/app/templates/${payload.templateName}.ejs`,
	);

	const html = await ejs.renderFile(
		templatePath,
		payload.data as unknown as ejs.Data,
	);

	await sendCommonEmail({
		to: payload.to,
		subject: payload.subject,
		data: html,
	});
};