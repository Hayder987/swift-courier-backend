import  httpStatus  from 'http-status';
import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { paymentService } from "./payment.service";
import { sendResponse } from "../../utils/sendResponse";


const createCheckoutSession = catchAsync(
  async (req: Request, res: Response) => {
    const customerId = req.user?.id;

    const result =
      await paymentService.createCheckoutSessionIntoDB(
        customerId as string,
        req.body,
      );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Checkout session created successfully.",
      data: result,
    });
  },
);


// export controller
export const paymentController = {
    createCheckoutSession
}
