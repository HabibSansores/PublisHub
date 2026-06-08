export async function GET() {
  if (!global.uploadStatus) {
    global.uploadStatus = {
      active: false,
      videoName: '',
      platforms: {}
    };
  }
  return Response.json(global.uploadStatus);
}
