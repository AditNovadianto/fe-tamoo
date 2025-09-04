import { useState, useRef, useEffect } from "react";

type DataType = {
  audioUrl: any;
  _id: string;
  name: string;
  address: string;
  audioPath: string;
};

const App = () => {
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<number | null>(null);

  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const [datas, setDatas] = useState<DataType[]>([]);

  // 🔹 Fetch data dari backend saat pertama kali render
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URI}/api/data`);
        const result = await res.json();

        if (result.length > 0) {
          setDatas(result);
        } else {
          setDatas([]);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setDatas([]);
      }
    };

    fetchData();
  }, [audioURL]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setAudioBlob(blob);
      setAudioURL(URL.createObjectURL(blob));
    };

    mediaRecorder.start();
    setRecording(true);

    setRecordingTime(0);
    timerRef.current = window.setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const submitHandler = async () => {
    if (!name || !address || !audioBlob) {
      alert("Please fill all fields and record audio.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("address", address);
      formData.append("audio", audioBlob, "recording.webm");

      const res = await fetch(`${import.meta.env.VITE_API_URI}/api/data/submit`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload");
      }

      // ✅ setelah submit, fetch ulang semua data dari backend
      const updated = await fetch(`${import.meta.env.VITE_API_URI}/api/data`);
      const result = await updated.json();
      if (result.success) {
        setDatas(result.datas);
      }

      // Reset fields
      setName("");
      setAddress("");
      setAudioURL("");
      setAudioBlob(null);
      setRecordingTime(0);
    } catch (err) {
      console.error(err);
      alert("Upload failed!");
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  console.log(datas);

  return (
    <div className="p-4">
      <div className="w-[50%] mx-auto flex flex-col gap-5 bg-blue-200 p-5 rounded-lg shadow">
        <p className="text-2xl font-bold">Form Data</p>

        <div>
          <p>Nama</p>
          <input
            value={name}
            className="mt-3 px-3 py-2 w-full border-2 border-black rounded-lg"
            type="text"
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <p>Alamat</p>
          <input
            value={address}
            className="mt-3 px-3 py-2 w-full border-2 border-black rounded-lg"
            type="text"
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-3 w-full">
          <p>Rekaman Audio</p>

          <button
            onClick={recording ? stopRecording : startRecording}
            className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded"
          >
            {recording ? "Stop Recording" : "Start Recording"}
          </button>

          {recording && (
            <p className="text-red-600 font-semibold">
              Recording... {formatTime(recordingTime)}
            </p>
          )}

          {!recording && audioURL && (
            <div className="mt-3">
              <p className="font-semibold">Preview Rekaman:</p>
              <audio controls className="w-full mt-2">
                <source src={audioURL} type="audio/webm" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>

        <button
          onClick={submitHandler}
          className="bg-green-500 text-white px-4 py-2 rounded cursor-pointer"
        >
          Submit
        </button>
      </div>

      {datas.length > 0 && (
        <div className="w-[50%] mx-auto mt-10">
          <h2 className="text-2xl font-bold mb-5">Submitted Data</h2>

          <ul className="flex flex-col gap-5">
            {datas.map((data) => (
              <li key={data._id} className="bg-gray-100 p-4 rounded-lg shadow">
                <p>
                  <strong>Nama:</strong> {data.name}
                </p>
                <p>
                  <strong>Alamat:</strong> {data.address}
                </p>
                <audio controls className="mt-3 w-full">
                  <source
                    src={data.audioUrl}
                    type="audio/webm; codecs=opus"
                  />
                  Browser kamu tidak mendukung audio element.
                </audio>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default App;
