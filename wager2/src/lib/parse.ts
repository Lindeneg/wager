import z from "zod";
import {NextRequest} from "next/server";
import HttpException from "@/lib/http-exception";
import {success, failure, type Result} from "@/result";

export async function parseRequestBody<TSchema extends z.core.$ZodType>(
    request: NextRequest,
    schema: TSchema
): Promise<Result<z.core.output<TSchema>, HttpException>> {
    let body: unknown;
    try {
        body = await request.json();
    } catch (err) {
        return failure("failed to parse request", HttpException.internal(err));
    }
    const parsed = z.safeParse(schema, body);
    if (!parsed.success) {
        return failure(
            "failed to validate schema",
            HttpException.malformedBody(parsed.error)
        );
    }
    return success(parsed.data);
}
