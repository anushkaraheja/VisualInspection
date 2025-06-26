import React from 'react';
import { useFormik } from 'formik';

const AddUser = ({ onClose }) => {
  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      displayName: '',
      email: '',
      password: '',
      role: '',
      setDefaultPassword: false,
    },
    onSubmit: (values) => {
      // handle form submission
      console.debug(values);
      onClose();
    },
  });
  /* eslint-disable i18next/no-literal-string */
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50 overflow-y-auto">
      <div className="bg-white p-4 md:p-10 w-full md:w-3/4 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-8 border-b-2 pb-3">
          <h2 className="text-xl font-semibold text-[#17355D]">
            Create New User
          </h2>
          <button onClick={onClose} className="text-xl font-thin">
            X Close
          </button>
        </div>
        <form onSubmit={formik.handleSubmit}>
          <div className="flex flex-col gap-8 md:gap-16 mt-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                <label className="flex flex-col flex-1 font-thin gap-1">
                  <p>First Name</p>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    onChange={formik.handleChange}
                    value={formik.values.firstName}
                    className="border border-[#949494] p-2 bg-white"
                  />
                </label>
                <label className="flex flex-col flex-1 font-thin gap-1">
                  <p>Last Name</p>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    onChange={formik.handleChange}
                    value={formik.values.lastName}
                    className="border border-[#949494] p-2 bg-white"
                  />
                </label>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <label className="flex-1 flex flex-col w-full md:w-1/2 font-thin gap-1">
                  <p>Display Name</p>
                  <input
                    type="name"
                    name="name"
                    placeholder="Display Name"
                    onChange={formik.handleChange}
                    value={formik.values.displayName}
                    className="border border-[#949494] p-2 bg-white"
                  />
                </label>
                <div className="flex-1 hidden md:block"></div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:justify-between">
                <p className="font-semibold mb-2 md:mb-0">Login details</p>
                <label className="flex gap-2">
                  <input
                    type="checkbox"
                    name="setDefaultPassword"
                    onChange={formik.handleChange}
                    checked={formik.values.setDefaultPassword}
                    className="checked:accent-[#17355D] accent-white bg-white focus:accent-[#17355D]"
                  />
                  <p className="font-thin">Set Default Password</p>
                </label>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <label className="font-thin flex flex-col flex-1 gap-1">
                  <p>User Email*</p>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="Email"
                    onChange={formik.handleChange}
                    value={formik.values.email}
                    className="w-full font-thin bg-white border border-[#949494] p-2"
                  />
                </label>
                <label className="font-thin flex flex-col flex-1 gap-1">
                  <p>Password</p>
                  <input
                    type="password"
                    name="password"
                    disabled={formik.values.setDefaultPassword}
                    placeholder="Password"
                    onChange={formik.handleChange}
                    value={formik.values.password}
                    className="w-full font-thin border bg-white border-[#949494] p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </label>
              </div>
              <div className="flex flex-col gap-2">
                <p>Select Role</p>
                <div className="flex gap-4">
                  <label className="flex gap-2">
                    <input
                      type="radio"
                      name="gender"
                      value="admin"
                      onChange={formik.handleChange}
                      checked={formik.values.role === 'male'}
                    />
                    <p className="font-thin">Member</p>
                  </label>
                  <label className="flex gap-2">
                    <input
                      type="radio"
                      name="gender"
                      value="member"
                      onChange={formik.handleChange}
                      checked={formik.values.role === 'member'}
                    />
                    <p className="font-thin">Admin</p>
                  </label>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <button
                  type="submit"
                  className="bg-[#16355D] hover:bg-[#BA2025] text-white py-2 px-4 rounded w-full md:w-auto"
                >
                  Create and Add User
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-[#16355D] hover:bg-[#BA2025] text-white py-2 px-4 rounded w-full md:w-auto"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
  /* eslint-disable i18next/no-literal-string */
};

export default AddUser;
