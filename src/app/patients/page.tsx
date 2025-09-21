"use client";
import Spinner from "@/components/Spinner";
import Topbar from "@/components/TopBar";
import { useEffect, useState } from "react";


type Patient = { id: string; name: string; phone: string };

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchPatients();
  }, []);

  async function fetchPatients() {
    setLoading(true);
    const r = await fetch("/api/patients");
    setPatients(await r.json());
    setLoading(false);
  }
  if (loading) {
    return (
      <div className="p-6">
        <Topbar title="Patients" />
        <Spinner />
      </div>
    );
  }

  async function addPatient(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    setName("");
    setPhone("");
    fetchPatients();
  }

  async function callPatient(id: string) {
    await fetch("/api/calls/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: id }),
    });
    alert("Call initiated");
  }

  return (
    <div>
      <Topbar title="Patients" subtitle="Add patients and initiate calls" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <div className="lg:col-span-1">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-medium mb-2">Add Patient</h3>
            <form onSubmit={addPatient} className="space-y-3">
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full input input-bordered" />
              <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="w-full input input-bordered" />
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-md">Add</button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
            <h3 className="font-medium mb-3">Patient List</h3>
            <table className="w-full text-sm">
              <thead className="text-slate-600 text-left">
                <tr>
                  <th className="py-2">Name</th>
                  <th>Phone</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="py-2">{p.name}</td>
                    <td>{p.phone}</td>
                    <td>
                      <button onClick={() => callPatient(p.id)} className="px-2 py-1 bg-emerald-600 text-white rounded-sm text-sm">
                        Call
                      </button>
                    </td>
                  </tr>
                ))}
                {!patients.length && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-500">No patients yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
