import type {AnyObj} from "@/types";

export type ResultSuccess<TData> = {
    data: TData;
    ok: true;
};

export interface ResultFailure {
    msg: string;
    ok: false;
}

export interface ResultFailureWithCtx<TErrorCtx extends AnyObj>
    extends ResultFailure {
    ctx: TErrorCtx;
}

export type ErrorResult<TErrorCtx extends AnyObj = never> = [
    TErrorCtx,
] extends [never]
    ? ResultFailure
    : ResultFailureWithCtx<TErrorCtx>;

export type Result<TData = null, TErrorCtx extends AnyObj = never> =
    | ResultSuccess<TData>
    | ErrorResult<TErrorCtx>;

export function success<TData>(data: TData): ResultSuccess<TData> {
    return {data, ok: true};
}

export function emptySuccess(): ResultSuccess<null> {
    return {data: null, ok: true};
}

export function failure<TCtx extends AnyObj = never>(
    ...[msg, ctx]: [TCtx] extends [never]
        ? [msg: string]
        : [msg: string, ctx: TCtx]
): ErrorResult<TCtx> {
    if (ctx === undefined) return {msg, ok: false} as ErrorResult<TCtx>;
    return {msg, ctx, ok: false} as ErrorResult<TCtx>;
}

export function unwrap<T extends Result<any>>(
    r: T
): [T] extends [Result<infer TData>] ? TData : never {
    if (!r.ok) throw new Error(r.msg);
    return r.data;
}
