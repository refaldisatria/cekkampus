export { default } from "next-auth/middleware";
export const config = {
  matcher: ["/search/:path*", "/rooms/:path*", "/ticket/:path*", "/staff/:path*"],
};
