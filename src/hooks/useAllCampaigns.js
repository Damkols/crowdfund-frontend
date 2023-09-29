import { useEffect, useState } from "react";
import useCampaignCount from "./useCampaignCount";
import { useConnection } from "../context/connection";
import {
 getCrowdfundContract,
 getCrowdfundContractWithProvider,
} from "../utils";

const useAllCampaigns = () => {
 const [campaigns, setCampaigns] = useState([]);
 const { provider } = useConnection();
 const campaignNo = useCampaignCount();

 useEffect(() => {
  const fetchAllCampaigns = async () => {
   try {
    const contract = await getCrowdfundContract(provider, false);
    const campaignsKeys = Array.from(
     { length: Number(campaignNo) },
     (_, i) => i + 1
    );
    const campaignPromises = campaignsKeys.map((id) => contract.crowd(id));

    const campaignContributors = campaignsKeys.map(async (id) => {
     const contributorsResult = await contract.getContributors(id);
     const contributorsArray = contributorsResult.toArray();
     return contributorsArray;
    });

    const campaignResults = await Promise.all(campaignPromises);
    const campaignContribute = await Promise.all(campaignContributors);

    const campaignDetails = campaignResults.map((details, index) => ({
     id: campaignsKeys[index],
     title: details.title,
     fundingGoal: details.fundingGoal,
     owner: details.owner,
     durationTime: Number(details.durationTime),
     isActive: details.isActive,
     fundingBalance: details.fundingBalance,
     //  contributors: details.contributors,
     contributors: campaignContribute[index],
    }));

    setCampaigns(campaignDetails);
    console.log(campaignDetails);
   } catch (error) {
    console.error("Error fetching campaigns:", error);
   }
  };

  fetchAllCampaigns();

  // Listen for event
  //   const handleProposeCampaignEvent = (id, title, amount, duration) => {
  //    console.log({ id, title, amount, duration });
  //   };
 }, [campaignNo, provider]);

 useEffect(() => {
  const handleProposeCampaignEvent = (id, title, fundingGoal, durationTime) => {
   const newCampaign = {
    id,
    title,
    fundingGoal,
    durationTime: Number(durationTime),
    fundingBalance: 0,
    contributors: [],
   };
   console.log({ id, title, fundingGoal, durationTime });
   setCampaigns((prevCampaigns) => [...prevCampaigns, newCampaign]);
   console.log(campaigns);
  };

  const contract = getCrowdfundContractWithProvider(provider);
  contract.on("ProposeCampaign", handleProposeCampaignEvent);

  return () => {
   contract.off("ProposeCampaign", handleProposeCampaignEvent);
  };
 }, [campaigns, provider]);

 return campaigns;
};

export default useAllCampaigns;
