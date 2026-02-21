import React from 'react';
import { CheckCircle, FileText } from 'lucide-react';

/**
 * Shown on the Entrepreneur job detail page when the student has an approved business proposal.
 */
const EntrepreneurApprovedInstructions: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary-600" />
        🚀 After Your Business Is Approved
      </h2>

      <section>
        <h3 className="font-semibold text-gray-900 mb-2">1️⃣ Pay and Register</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
          <li>Pay your startup cost</li>
          <li>Accept your loan (if you took one)</li>
          <li>Your business is now <strong>OPEN</strong></li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-gray-900 mb-2">2️⃣ Tell the Town</h3>
        <p className="text-gray-700 text-sm">
          Post one short message: <strong>What you sell</strong>, <strong>how much it costs</strong>, and <strong>who it is for</strong>. Keep it simple.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-gray-900 mb-2">3️⃣ Run Your Business Each Week</h3>
        <p className="text-gray-700 text-sm mb-2">Every week you must do 3 things:</p>
        <ul className="list-none space-y-1 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span><strong>A. Record Sales</strong> – How many items sold or hours worked?</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span><strong>B. Record Costs</strong> – Materials or other weekly costs.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span><strong>C. Check Profit</strong> – The app shows Revenue, Costs, Profit.</span>
          </li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-gray-900 mb-2">4️⃣ Make One Business Decision</h3>
        <p className="text-gray-700 text-sm mb-1">Each week choose ONE:</p>
        <ul className="list-disc list-inside text-gray-700 text-sm space-y-0.5">
          <li>Keep price the same</li>
          <li>Increase price</li>
          <li>Decrease price</li>
          <li>Try to sell more</li>
          <li>Improve your product/service</li>
        </ul>
        <p className="text-gray-600 text-sm mt-2">Write one sentence explaining why.</p>
      </section>

      <section>
        <h3 className="font-semibold text-gray-900 mb-2">5️⃣ Pay What You Owe</h3>
        <p className="text-gray-700 text-sm">
          Pay loan instalment (if you have one), pay insurance (if required), pay tax (if required). If you don&apos;t pay → consequences.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-gray-900 mb-2">6️⃣ Monthly Check-In (Every 4 Weeks)</h3>
        <p className="text-gray-700 text-sm mb-1">Answer 3 questions:</p>
        <ul className="list-disc list-inside text-gray-700 text-sm space-y-0.5">
          <li>Did you make profit or loss?</li>
          <li>What worked well?</li>
          <li>What will you change?</li>
        </ul>
        <p className="text-gray-600 text-sm mt-1">Short answers only.</p>
      </section>

      <section>
        <h3 className="font-semibold text-gray-900 mb-2">7️⃣ If Things Go Wrong</h3>
        <p className="text-gray-700 text-sm">
          If you lose money for 3 weeks in a row: you must adjust your plan; you may close the business; you may ask for help.
        </p>
      </section>

      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mt-4">
        <p className="text-primary-800 font-medium text-sm">
          <strong>That&apos;s It.</strong> Simple weekly loop: <strong>Sell → Record → Decide → Improve</strong>
        </p>
      </div>
    </div>
  );
};

export default EntrepreneurApprovedInstructions;
