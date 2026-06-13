import re
import zlib

pdf_path = "/Users/shubhamverma/.gemini/antigravity/brain/6d858482-51a0-45b5-a14a-461adea83fa8/media__1781291194536.pdf"
static_dir = "/Users/shubhamverma/Documents/JavaProjects/startup/lockedIn/src/main/resources/static"

with open(pdf_path, "rb") as f:
    data = f.read()

# Find all XObjects/Images in the PDF
# We search for streams and look at the dictionary preceding them
stream_matches = list(re.finditer(b"stream", data))
endstream_matches = list(re.finditer(b"endstream", data))

image_count = 0

for idx, match in enumerate(stream_matches):
    start = match.start()
    # Find the nearest endstream after this stream start
    end = next((e.start() for e in endstream_matches if e.start() > start), None)
    if not end:
        continue
    
    # Extract the stream data
    stream_content = data[start:end]
    if stream_content.startswith(b"stream\r\n"):
        stream_data = stream_content[8:]
    elif stream_content.startswith(b"stream\n"):
        stream_data = stream_content[7:]
    else:
        stream_data = stream_content[6:]
    stream_data = stream_data.strip()
    
    # Look backwards from the "stream" keyword to find the object dictionary << ... >>
    # Usually the dictionary is within 500 bytes before the stream
    dict_start = data.rfind(b"<<", 0, start)
    if dict_start == -1 or start - dict_start > 1000:
        continue
    
    dict_data = data[dict_start:start]
    
    if b"/Subtype /Image" in dict_data or b"/Image" in dict_data:
        image_count += 1
        # Determine image format
        is_jpeg = b"/DCTDecode" in dict_data
        
        # Determine width and height if available in the dictionary
        width_match = re.search(b"/Width\s+(\d+)", dict_data)
        height_match = re.search(b"/Height\s+(\d+)", dict_data)
        w = width_match.group(1).decode() if width_match else "unknown"
        h = height_match.group(1).decode() if height_match else "unknown"
        
        if is_jpeg:
            img_path = f"{static_dir}/logo_{image_count}.jpg"
            with open(img_path, "wb") as img_file:
                img_file.write(stream_data)
            print(f"Extracted JPEG Image {image_count} ({w}x{h}) to {img_path}")
        else:
            # Try to decompress FlateDecode stream
            try:
                decompressed = zlib.decompress(stream_data)
                # Since PIL/Pillow is not guaranteed, we can write the raw decompressed data or try to format it
                img_path = f"{static_dir}/logo_{image_count}.raw"
                with open(img_path, "wb") as img_file:
                    img_file.write(decompressed)
                print(f"Extracted Raw/Flate Image {image_count} ({w}x{h}) to {img_path}")
            except Exception as e:
                # If zlib fails or is not zlib, write raw compressed
                img_path = f"{static_dir}/logo_{image_count}.bin"
                with open(img_path, "wb") as img_file:
                    img_file.write(stream_data)
                print(f"Extracted Binary Stream {image_count} to {img_path} (decompress failed: {e})")

print(f"Scanned all streams. Total image objects found: {image_count}")
