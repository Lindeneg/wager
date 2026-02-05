import z from "zod";
import {NextRequest} from "next/server";
import HttpException from "@/lib/http-exception";
import {success, failure, type Result} from "@/result";

const DEFAULT_PARSE_ERROR = "An error occured.";

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
        const treeifiedError = z.treeifyError(parsed.error);
        let err: unknown = DEFAULT_PARSE_ERROR;
        if (
            "properties" in treeifiedError &&
            treeifiedError.properties !== undefined
        ) {
            err = {...treeifiedError.properties};
        }
        return failure(
            "failed to validate schema",
            HttpException.malformedBody(err)
        );
    }
    return success(parsed.data);
}
